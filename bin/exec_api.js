var CREDENTIALS  = require('../config/config')
	 ,async        = require('async')
	 ,moment       = require('moment')
	 ,pg           = require('pg')
	 ,Sequelize    = require('sequelize')
	 ,sequelize    = new Sequelize(CREDENTIALS.db_url)
	 ,itemTypes    = {facebook: 2, youtube: 3, instagram: 4, twitter: 5, pinterest: 6, tumblr: 7}
	 ,mediaTypes   = {image: 1, video: 2, photo: 1}
	 ,Item         = sequelize.define('item', {
				itemtypeid: 			Sequelize.INTEGER,
				areaid:           Sequelize.INTEGER,
				sourceid: 		  	Sequelize.STRING,
				title:    				Sequelize.TEXT,
				description: 			Sequelize.TEXT,
				sourceurl: 				Sequelize.STRING,
				sourcecreatedutc: Sequelize.STRING,
				createdutc:       Sequelize.STRING,
				viewcount:  			Sequelize.INTEGER,
				coordinatexy:  		Sequelize.STRING,
				labelalignment:  	Sequelize.STRING,				
			  itemid: {
			    type: Sequelize.INTEGER,
			    primaryKey: true,
			    autoIncrement: true
		  	}		
			}, {
				timestamps: true, 
				updatedAt: false,
				createdAt: 'createdutc',		
				freezeTableName: true,
			})
	 ,Media        = sequelize.define('media', {
				itemid: 			    Sequelize.INTEGER,				
				mediatypeid:      Sequelize.INTEGER,
				mediaurl: 		  	Sequelize.STRING,			
			  mediaid	: {
			    type: Sequelize.INTEGER,
			    primaryKey: true,
			    autoIncrement: true
		  	}		
			}, {
				timestamps: false,
				freezeTableName: true,
			})

function pushToArray(_array, itemtypeid, sourceid, title, description, sourcecreatedutc, sourceurl) {
  var temp = {}
  temp.itemtypeid 			= itemTypes[itemtypeid]
  temp.sourceid 				= sourceid.toString()
  temp.title 						= title || ''
  temp.description 			= description  || ''
  temp.sourcecreatedutc = sourcecreatedutc
  temp.sourceurl 				= sourceurl
  //temp.areaid         = 24 // need to have data in area table and areatype
	temp.viewcount 				= 0
	temp.coordinatexy 		= '(70,4)'
	temp.labelalignment 	= 'LEFT'
  _array.push(temp)
  return _array
}

function run() {
	console.log("Aggregator initialized, runs every 10 minutes.")
	console.log("Feeds to be aggregated : " + Object.keys(itemTypes).join(', ') + ".")
	async.waterfall([
    function(callback) {
      Item.findAll({
        attributes: [[sequelize.fn('COUNT', sequelize.col('itemid')), 'count_items']],
      }).then(function(items){
        count = items[0].dataValues.count_items
        //count = 0
        callback(null, count)
      })
    },
    function(count, callback) {
      console.log("Instagram posts.")
  		data 		= [];
  		media   = [];
      var ig 	= require('instagram-node').instagram();
      ig.use({ access_token: CREDENTIALS.instagram.access_token })        
        ig.user_media_recent(CREDENTIALS.instagram.brandId, {count: 100}, function(err, result, remaining, limit) {
          if (result.length > 0) {
            if(count != 0){
              result = [result[0]]
            }
            for (var i = 0; i < result.length; i++) {
              post = result[i]
              type = post.type
              if(type == "image") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.images.standard_resolution.url})   
              if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.videos.standard_resolution.url})         
              date = moment(post.created_time, 'x').format()
              text = post.caption != null ? post.caption.text : ''
              data = pushToArray(data, 'instagram', post.id, text, text, date, post.link)              
            }
          }
          callback(null, count, data, media);
        })
    },
    function(count, data, media, callback) {
      console.log("Pinterest posts.")
			var PDK 			= require('node-pinterest');
      var pinterest = PDK.init(CREDENTIALS.pinterest.token);      
      pinterest.api('boards/' + CREDENTIALS.pinterest.user_board + '/pins',{ qs: {fields: 'id,created_at,note,link,image,media,attribution' }}).then(function(result) { //'boards/cocacola/holiday/pins/'        
        if (result.data.length > 0) {
          result = result.data
          if(count != 0){
            result = [result[0]]
          }          
          for (var i = 0; i < result.length; i++) {
            pin = result[i]
            if(pin.media != undefined){
              if(pin.media.type == 'image' && pin.image && pin.image.original != undefined){
                media.push({itemid: pin.id, mediatypeid: mediaTypes['image'], mediaurl: pin.image.original.url})   
              }
              if(pin.media.type == 'video' && pin.attribution != undefined){
                media.push({itemid: pin.id, mediatypeid: mediaTypes['video'], mediaurl: pin.attribution.url})   
              }                        
            }          
            data = pushToArray(data, 'pinterest', pin.id, pin.note, pin.note, pin.created_at, pin.link)
          }
        }
        callback(null, count, data, media);
      });		    	
    },
    function(count, data, media, callback) {
      console.log("twitter posts.")
      var Twitter = require('twitter');
      var twitter_client = new Twitter({
        consumer_key: CREDENTIALS.twitter.consumer_key,
        consumer_secret: CREDENTIALS.twitter.consumer_secret,
        access_token_key: CREDENTIALS.twitter.access_token,
        access_token_secret: CREDENTIALS.twitter.access_token_secret
      });

      twitter_client.get('search/tweets', { q: CREDENTIALS.twitter.title }, function(error, tweets, response) {                    
        if (tweets.statuses.length > 0) {
          result = tweets.statuses
          if(count != 0){
            result = [result[0]]
          }
          for (var i = 0; i < result.length; i++) {          
            tweet = result[i]
            if (tweet.entities.media != undefined){ // only media type photo
              media.push({itemid: tweet.id, mediatypeid: mediaTypes['photo'], mediaurl: tweet.entities.media[0].media_url})
            }
          	data = pushToArray(data, 'twitter', tweet.id, tweet.text, tweet.text, tweet.created_at, '')
          }
        }
        callback(null, count, data, media);
      });		    	
    },
    function(count, data, media, callback) {
      console.log("Youtube posts.")
      var youtubeV3;
      var google = require('googleapis'),
      youtubeV3 = google.youtube({
        version: CREDENTIALS.youtube.version,
        auth: CREDENTIALS.youtube.api_key
      });
      var request = youtubeV3.search.list({
          part: 'id, snippet',
          type: 'video',
          q: CREDENTIALS.youtube.title,
          maxResults: 50,
          order: 'date',
          safeSearch: 'moderate',
          videoEmbeddable: true
      }, (err, response) => {
        var sourceID, title, description, sourceCreatedUTC, sourceUrl;
        if (response.items.length > 0) {
          result = response.items
          if(count != 0){
            result = [result[0]]
          }          
          for (var i = 0; i < result.length; i++) { 
            var snippet = result[i]['snippet'];
            sourceID = result[i]['id']['videoId'];
            title = snippet.title;
            description = snippet.description;
            sourceCreatedUTC = snippet.publishedAt;
            sourceUrl = snippet.thumbnails.default.url;
            data = pushToArray(data, 'youtube', sourceID, title, description, sourceCreatedUTC, sourceUrl)
          }
        }
        callback(null, count, data, media);
      });		    	
    },
    function(count, data, media, callback) {
      console.log("tumblr posts.")
      var tumblr = require('tumblr');
      var oauth = {
          consumer_key: CREDENTIALS.tumblr.consumer_key,
          consumer_secret: CREDENTIALS.tumblr.consumer_secret,
          token: CREDENTIALS.tumblr.token,
          token_secret: CREDENTIALS.tumblr.token_secret
      };
      var blog = new tumblr.Blog(CREDENTIALS.tumblr.brandTitle, oauth);
      blog.text({ limit: 100 }, function(error, response) {
          if (response.posts.length > 0) {
            result = response.posts
            if(count != 0){
              result = [result[0]]
            }          
            for (var i = 0; i < result.length; i++) { 
              post = result[i]  
              type = post.type
              if(type == "photo") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.photos[0].alt_sizes[0].url})   
              if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.player[0].embed_code})
              	data = pushToArray(data, 'tumblr', post.id, post.title, post.blog_name, post.date, post.post_url)
              }
            }
            callback(null, count, data, media);
      });		    	
    },
    function(count, data, media, callback) {
      console.log("facebook posts.")
      var FB = require('fb');
      FB.api(CREDENTIALS.facebook.brandId + '/feed', { access_token: CREDENTIALS.facebook.access_token }, function(res) {                    
        if (res.data.length > 0) {
          result = res.data
          if(count != 0){
            result = [result[0]]
          }          
          for (var i = 0; i < result.length; i++) { 
            post = result[i]
            if (post.type != undefined){
              type = post.type
              if(type == "photo") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.picture})   
              if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.source})
            }            
         	  data = pushToArray(data, 'facebook', post.id, post.message, post.story, post.created_time, "")
          }
        }
        callback(null, data, media);
      });		    	
	    },
    function(data, media, callback) {
    	//console.log(media)
    	sourceids = data.map(function(item){ return item['sourceid'] })
    	Item.findAll({
    		where: {
    			sourceid: {$in: sourceids}
    		},
    		attributes: ['sourceid']
    	}).then(function(rows){
    		existingdata = rows.map(function(row){ return row['dataValues']['sourceid'].toString() })
    		for(var i = data.length - 1; i >= 0; i--) {	
			    if(existingdata.indexOf(data[i]['sourceid'].toString()) > -1){
			      data.splice(i, 1)
			    }
				}    		
				Item.bulkCreate(data).then(function(items) {	
					savedsourceids = items.map(function(row){ return row['dataValues']['sourceid'].toString() }) // data.map(function(item){ return item['sourceid'] })		
		    	Item.findAll({
		    		where: {
		    			sourceid: {$in: savedsourceids}
		    		},
		    		attributes: ['itemid', 'sourceid']
		    	}).then(function(items){	
		    		_items = {}	
		    		_media = []		
		    		for (var i = 0; i < items.length; i++) {
		    			_items[items[i].sourceid] = items[i].itemid
		    		}
		    		for (var i = 0; i < media.length; i++) {
		    			if(_items[media[i].itemid] != undefined) _media.push({itemid: _items[media[i].itemid], mediatypeid: media[i].mediatypeid, mediaurl: media[i].mediaurl})
		    		}		    		
		    		Media.bulkCreate(_media).then(function(savedmedia) {		    			
	  					callback(null, _items)
	  				})
	  			})
				})
    	})
	  }
	], function (err, result) {
      if(err) console.log(err)
      else    console.log("finished")
	})  	
}

run()