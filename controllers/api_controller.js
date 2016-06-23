var express = require('express')
	 ,router  = express.Router()
	 ,CREDENTIALS  = require('../config/config')
	 ,async        = require('async')
	 ,pg           = require('pg')
	 ,Sequelize    = require('sequelize')
	 ,sequelize = new Sequelize('postgres://'+CREDENTIALS.pg.user+':'+CREDENTIALS.pg.password+'@'+CREDENTIALS.pg.host+':'+CREDENTIALS.pg.port+'/'+CREDENTIALS.pg.database);


function pushToArray(_array, itemType, sourceID, title, description, sourceCreatedUTC, sourceUrl) {
    var temp = {};
    temp.itemType = itemType;
    temp.sourceID = sourceID;
    temp.title = title;
    temp.description = description;
    temp.sourceCreatedUTC = sourceCreatedUTC;
    temp.sourceUrl = sourceUrl;
    _array.push(temp);
    return _array;
}

/*
for the item type
itemType ==2 //facebook
itemType ==4 //instagram
itemType ==6 //pinterest
itemType ==5 //twitter
itemType ==3 //youtube
itemType ==7 //tumblr
 */

router.get('/', function(req, res, next) {
	var Item = sequelize.define('item', {
		sourceid: Sequelize.STRING,
		title:    Sequelize.TEXT,
		description: Sequelize.TEXT,
		itemtypeid: Sequelize.INTEGER,
		viewcount:  Sequelize.INTEGER,
		coordinatexy:  Sequelize.STRING,
		labelalignment:  Sequelize.STRING,
		sourcecreatedutc:  Sequelize.DATE,
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
	});
	sequelize.sync().then(function() {
	  return Item.create({
    	sourceid: 2,
		title:    'title',
		description: "<hello> w/ook ",
		itemtypeid: 2,
		viewcount:  0,
		coordinatexy:  '52622450',
		labelalignment:  'labelalignment',
		sourcecreatedutc:  new Date(),
	  });
	}).then(function(item) {
	  console.log("done !");
	  res.send({status: "200", data: item.get({plain: true})})
	});	
})

router.get('/2', function(req, res, next) {
	async.waterfall([
    function(callback) {
  		data = []
      var ig = require('instagram-node').instagram(); //3263523015,249655166
      ig.use({ access_token: CREDENTIALS.instagram.access_token });
      ig.user_media_recent(CREDENTIALS.instagram.brandId, function(err, result, remaining, limit) {  
        if (result) {                 
          var temp = Number('' + result[0].created_time + '000');
          var time = (new Date(temp)).toUTCString();                 
          data = pushToArray(data, 4, result[0].id, result[0].caption, result[0].caption, time, result[0].link)
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
          data = pushToArray(data, 6, array[0].id, array[0].note, array[0].note, date, array[0].link)
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
        	data = pushToArray(data, 5, tweets.statuses[0].id, tweets.statuses[0].text, tweets.statuses[0].text, tweets.statuses[0].created_at, '')
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
          data = pushToArray(data, 3, sourceID, title, description, sourceCreatedUTC, sourceUrl)
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
          	data = pushToArray(data, 7, response.posts[0].id, response.posts[0].title, response.posts[0].blog_name, response.posts[0].date, response.posts[0].post_url)
          }
          callback(null, data);
      });		    	
    },
    function(data, callback) {
      var FB = require('fb');
      FB.api(CREDENTIALS.facebook.brandId + '/feed', { access_token: CREDENTIALS.facebook.access_token }, function(res) {                    
          if (res.data[0]) {
          	data = pushToArray(data, 2, res.data[0].id, res.data[0].story, res.data[0].story, res.data[0].created_time, "")
          }
          callback(null, data);
      });		    	
	    },
    function(data, callback) {
              var pg_client = new pg.Client({
                  user: CREDENTIALS.pg.user,
                  password: CREDENTIALS.pg.password,
                  database: CREDENTIALS.pg.database,
                  port:  CREDENTIALS.pg.port,
                  host:  CREDENTIALS.pg.host,
                  ssl: false
              });

              pg_client.connect(function(err) {
                  if (err) {
                  	callback('could not connect to postgres', data)                        
                  }
                  var count = 0;
                  var len = data.length;
                  for (var i = 0; i < len; i++) {
                      var string = '' + data[i].title;
                      string = string.replace("'", "\'");
                      var length = 199;
                      var title = string.substring(0, length);

                      var description = escape(data[i].description);
                      var temp = new Date();
                      var defaultDate = temp.toUTCString();
                      var query = 
                      "insert into Item ( SourceID, AreaID, ItemTypeID, Title,  Description, ViewCount, SourceURL, CoordinateXY, "+
                      "LabelAlignment,  CreatedUTC, SourceCreatedUTC) SELECT  '" + 
                      data[i].sourceID + "', 24, "+data[i].itemType+", '" + title + "',  '" + description + "', 0, '" + 
                      data[i].sourceUrl + "', '(70,4)', 'LEFT','"+defaultDate+"',  '" + data[i].sourceCreatedUTC + 
                      "' WHERE NOT EXISTS (SELECT sourceid FROM Item  WHERE sourceid = '" + data[i].sourceID + "' AND itemtypeid='" + 
                      data[i].itemType + "');";
                          console.log(query)

                      pg_client.query(query, function(err, result) {
                          if (err) {
                              return console.error('error running query', err);
                          } else {
                              console.log("input success!");
                          }
                          count++;
                          if (count == len) {
                              pg_client.end();
                              data = [];
                          }
                      });                        
                  }
                  callback(null, data);
              });		    	
	    }
	], function (err, result) {
	    if(err) res.send({status: "error", err: err})
	    else	  res.send({status: "200", data: data})
	});		
})


module.exports = router;