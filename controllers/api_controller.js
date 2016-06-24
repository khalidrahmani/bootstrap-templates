var express = require('express')
	 ,router  = express.Router()
	 ,CREDENTIALS  = require('../config/config')
	 ,async        = require('async')
	 ,moment       = require('moment')
	 ,pg           = require('pg')
	 ,Sequelize    = require('sequelize')
	 ,sequelize    = new Sequelize(CREDENTIALS.db_url)
	 ,itemTypes    = {facebook: 2, youtube: 3, instagram: 4, twitter: 5, pinterest: 6, tumblr: 7}
	 ,Item = sequelize.define('item', {
				itemtypeid: 			Sequelize.INTEGER,
				areaid:           Sequelize.INTEGER,
				sourceid: 		  	Sequelize.STRING,
				title:    				Sequelize.TEXT,
				description: 			Sequelize.TEXT,
				sourceurl: 				Sequelize.STRING,
				sourcecreatedutc: Sequelize.DATE,
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

/*
function pushToArray(_array, itemType, sourceID, title, description, sourceCreatedUTC, sourceUrl) {
    var temp = {};
    temp.itemType = itemType;
    temp.sourceID = sourceID;
    temp.title = title;
    temp.description = description;
    temp.sourcecreatedutc = sourceCreatedUTC;
    temp.sourceUrl = sourceUrl;
    _array.push(temp);
    return _array;
}
*/

function pushToArray(_array, itemtypeid, sourceid, title, description, sourcecreatedutc, sourceurl) {
  var temp = {}
  temp.itemtypeid 			= itemTypes[itemtypeid]
  temp.sourceid 				= sourceid.toString()
  temp.title 						= title || ''
  temp.description 			= description  || ''
  temp.sourcecreatedutc = sourcecreatedutc
  temp.sourceurl 				= sourceurl
  //temp.areaid           = 24 // need to have data in area table and areatype
	temp.viewcount 				= 0
	temp.coordinatexy 		= '(70,4)'
	temp.labelalignment 	= 'LEFT'
  _array.push(temp)
  return _array
}

router.get('/2', function(req, res, next) {
	Item.bulkCreate([  { itemtypeid: 3,
    sourceid: 'icrz-7SdP0s',
    title: 'Lariss - Coca cola the voice happy energy tour 2016',
    description: '',
    sourcecreatedutc: "2016-06-24T12:08:49.435Z",
    sourceurl: 'https://i.ytimg.com/vi/icrz-7SdP0s/default.jpg',
    viewcount: 0,
    coordinatexy: '',
    labelalignment: '' },
  { itemtypeid: 2,
    sourceid: '40796308305_958069170957792',
    title: '',
    description: '',
    sourcecreatedutc: "2016-06-24T12:08:49.435Z",
    sourceurl: '',
    viewcount: 0,
    coordinatexy: '',
    labelalignment: '' } ]).then(function(item) {
	  		console.log("done !");
	  		res.send({status: "200", data: item})
		});	
})

router.get('/', function(req, res, next) {
	async.waterfall([
    function(callback) {
  		data = []
      var ig = require('instagram-node').instagram(); //3263523015,249655166
      ig.use({ access_token: CREDENTIALS.instagram.access_token });
      ig.user_media_recent(CREDENTIALS.instagram.brandId, function(err, result, remaining, limit) {  
        if (result.length > 0) {              
          data = pushToArray(data, 'instagram', result[0].id, result[0].caption, result[0].caption, moment(result[0].created_time, 'x'), result[0].link)
        }
        callback(null, data);
      });
    },
    function(data, callback) {
			var PDK = require('node-pinterest');
      var pinterest = PDK.init(CREDENTIALS.pinterest.token);
      pinterest.api('boards/' + CREDENTIALS.pinterest.user_board + '/pins').then(function(result) { //'boards/cocacola/holiday/pins/'
        if (result) {
          var temp = new Date();
          var date = temp.toUTCString();
          var array = result.data;
          data = pushToArray(data, 'pinterest', array[0].id, array[0].note, array[0].note, date, array[0].link)
        }
        callback(null, data);
      });		    	
    },
    function(data, callback) {
      var Twitter = require('twitter');
      var twitter_client = new Twitter({
        consumer_key: CREDENTIALS.twitter.consumer_key,
        consumer_secret: CREDENTIALS.twitter.consumer_secret,
        access_token_key: CREDENTIALS.twitter.access_token,
        access_token_secret: CREDENTIALS.twitter.access_token_secret
      });

      twitter_client.get('search/tweets', { q: CREDENTIALS.twitter.title }, function(error, tweets, response) {                    
        if (tweets.statuses[0]) {
        	data = pushToArray(data, 'twitter', tweets.statuses[0].id, tweets.statuses[0].text, tweets.statuses[0].text, tweets.statuses[0].created_at, '')
        }
        callback(null, data);
      });		    	
    },
    function(data, callback) {
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
          maxResults: 1,
          order: 'date',
          safeSearch: 'moderate',
          videoEmbeddable: true
      }, (err, response) => {
        var sourceID, title, description, sourceCreatedUTC, sourceUrl;
        if (response.items[0]) {
          var snippet = response.items[0]['snippet'];
          sourceID = response.items[0]['id']['videoId'];
          title = snippet.title;
          description = snippet.description;
          sourceCreatedUTC = snippet.publishedAt;
          sourceUrl = snippet.thumbnails.default.url;
          data = pushToArray(data, 'youtube', sourceID, title, description, sourceCreatedUTC, sourceUrl)
        }
        callback(null, data);
      });		    	
    },
    function(data, callback) {
      var tumblr = require('tumblr');
      var oauth = {
          consumer_key: CREDENTIALS.tumblr.consumer_key,
          consumer_secret: CREDENTIALS.tumblr.consumer_secret,
          token: CREDENTIALS.tumblr.token,
          token_secret: CREDENTIALS.tumblr.token_secret
      };

      var blog = new tumblr.Blog(CREDENTIALS.tumblr.brandTitle, oauth);
      blog.text({ limit: 1 }, function(error, response) {
          if (response.posts[0]) {
          	data = pushToArray(data, 'tumblr', response.posts[0].id, response.posts[0].title, response.posts[0].blog_name, response.posts[0].date, response.posts[0].post_url)
          }
          callback(null, data);
      });		    	
    },
    function(data, callback) {
      var FB = require('fb');
      FB.api(CREDENTIALS.facebook.brandId + '/feed', { access_token: CREDENTIALS.facebook.access_token }, function(res) {                    
          if (res.data[0]) {
          	data = pushToArray(data, 'facebook', res.data[0].id, res.data[0].story, res.data[0].story, res.data[0].created_time, "")
          }
          callback(null, data);
      });		    	
	    },
    function(data, callback) {    	
    	sourceids = data.map(function(item){ return item['sourceid'] })
	    	/*
		    	Item.destroy({
		    		where: {
		    			sourceid: {$in: sourceids}
		    		}
		    	}).then(function(rows){
						Item.bulkCreate(data).then(function(items) {
			  			//console.log(items);
			  			//res.send({status: "200", data: item})
			  			callback(null, items);
						})
		    	})			
				*/
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
		  			callback(null, data);
					})
	    	})
	    }
	], function (err, result) {
	    if(err) res.send({status: "error", err: err})
	    else	  res.send({status: "200", data: data})
	});		
})

module.exports = router;