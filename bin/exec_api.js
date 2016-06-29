var CREDENTIALS     = require('../config/config')
   ,async           = require('async')
   ,moment          = require('moment')
   ,request         = require('request')
   ,pg              = require('pg')
   ,striptags       = require('striptags')
   ,Sequelize       = require('sequelize')
   ,sequelize       = new Sequelize(CREDENTIALS.db_url, {logging: false})
   ,PDK             = require('node-pinterest')
   ,pinterest       = PDK.init(CREDENTIALS.pinterest.token)
   ,google          = require('googleapis')
   ,youtubeV3       = google.youtube({ version: CREDENTIALS.youtube.version,  auth: CREDENTIALS.youtube.api_key })
   ,Twitter         = require('twitter')
   ,twitter_client  = new Twitter({
        consumer_key: CREDENTIALS.twitter.consumer_key,
        consumer_secret: CREDENTIALS.twitter.consumer_secret,
        access_token_key: CREDENTIALS.twitter.access_token,
        access_token_secret: CREDENTIALS.twitter.access_token_secret
      })
   ,itemTypes                 = {} 
   ,mediaTypes                = {} 
   ,youtubeLatestPuplishDate  = null
   ,latestTweetId             = null
   ,latestFacebookPostDate    = null
   ,latestInstagramPostDate   = null
   ,latestPinterestPostId     = null
   ,latestTumblerPostId       = null
   ,Item         = sequelize.define('item', {
        itemtypeid:       Sequelize.INTEGER,
        areaid:           Sequelize.INTEGER,
        sourceid:         Sequelize.STRING,
        title:            Sequelize.TEXT,
        description:      Sequelize.TEXT,
        sourceurl:        Sequelize.STRING,
        sourcecreatedutc: Sequelize.STRING,
        createdutc:       Sequelize.STRING,
        viewcount:        Sequelize.INTEGER,
        coordinatexy:     Sequelize.STRING,
        labelalignment:   Sequelize.STRING,       
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
        itemid:           Sequelize.INTEGER,        
        mediatypeid:      Sequelize.INTEGER,
        mediaurl:         Sequelize.STRING,     
        mediaid : {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }   
      }, {
        timestamps: false,
        freezeTableName: true,
      })
   ,MediaType        = sequelize.define('mediatype', {        
        type:         Sequelize.STRING,     
        mediatypeid : {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }   
      }, {
        timestamps: false,
        freezeTableName: true,
      })
   ,ItemType        = sequelize.define('itemtype', {        
        name:         Sequelize.STRING,     
        iconurl:      Sequelize.STRING,     
        itemtypeid : {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }   
      }, {
        timestamps: false,
        freezeTableName: true,
      })   

function pushToArray(_array, itemtypeid, sourceid, title, description, sourcecreatedutc, sourceurl) {
  var temp    = {}
  description = description   || ''
  title       = title         || description || 'Blank'  
  temp.itemtypeid       = itemTypes[itemtypeid]
  temp.sourceid         = sourceid.toString()
  temp.title            = striptags(title)//title.replace(/(\r\n|\n|\r)/gm,"")
  temp.description      = striptags(description)//description.replace(/(\r\n|\n|\r)/gm,"")
  temp.sourcecreatedutc = sourcecreatedutc
  temp.sourceurl        = sourceurl
  temp.viewcount        = 0
  temp.coordinatexy     = '(70,4)'
  temp.labelalignment   = 'LEFT'  
  _array.push(temp)    
  return _array
}

function run() {
  console.log("Aggregator initialized, runs every 10 minutes.")  
  console.log("Feeds to be aggregated : Instagram, Pinterest, Twitter, Youtube, Tumblr, Facebook.")
  async.waterfall([
    function(callback) {         
        ItemType.findAll({}).then(function(itemtypes){
          for (var i = 0; i < itemtypes.length; i++) {
            itemTypes[itemtypes[i].name.toLowerCase()] = itemtypes[i].itemtypeid
          }
          
          MediaType.findAll({}).then(function(mediatypes){          
            for (var i = 0; i < mediatypes.length; i++) {
              mediaTypes[mediatypes[i].type.toLowerCase()] = mediatypes[i].mediatypeid
            }
            mediaTypes['photo'] = mediaTypes['image']            
              Item.findOne({ where: { itemtypeid: itemTypes['youtube'] },order: [ ['sourcecreatedutc', 'DESC'] ]}).then(function(youtube){   
                if(youtube && youtube.sourcecreatedutc) youtubeLatestPuplishDate = youtube.sourcecreatedutc
              Item.findOne({ where: { itemtypeid: itemTypes['twitter'] },order: [ ['sourceid', 'DESC'] ]}).then(function(tweet){       
                if(tweet) latestTweetId = tweet.sourceid
                Item.findOne({ where: { itemtypeid: itemTypes['facebook'] },order: [ ['sourcecreatedutc', 'DESC'] ]}).then(function(facebookpost){       
                  if(facebookpost) latestFacebookPostDate = moment(facebookpost.sourcecreatedutc).format('X')
                    Item.findOne({ where: { itemtypeid: itemTypes['instagram'] },order: [ ['sourcecreatedutc', 'DESC'] ]}).then(function(instagrampost){       
                      if(instagrampost) latestInstagramPostDate = moment(instagrampost.sourcecreatedutc).format('X')                      
                        Item.findOne({ where: { itemtypeid: itemTypes['pinterest'] },order: [ ['sourcecreatedutc', 'DESC'] ]}).then(function(pinterestpost){
                          if(pinterestpost) latestPinterestPostId = pinterestpost.sourcecreatedutc//.sourceid
                          Item.findOne({ where: { itemtypeid: itemTypes['tumblr'] },order: [ ['sourcecreatedutc', 'DESC'] ]}).then(function(tumblrtpost){
                          if(tumblrtpost) latestTumblerPostId = tumblrtpost.sourceid
                          callback(null)
                        })
                      })
                    })
                })
              })
          })
        })
      })
    },
    function(callback) { 
      console.log("Instagram posts.")
      data    = [];
      media   = [];
      request.get({url:"https://www.instagram.com/"+CREDENTIALS.instagram.userName+"/media/", json:true}, function (error, response, result) {
        if (result && result.items.length > 0) {
          result = result.items
          var j = 0
          for (var i = 0; i < result.length; i++) {
            skip = false
            post = result[i]
            type = post.type            
            if(latestInstagramPostDate != null) {
              if (post.created_time <= latestInstagramPostDate) skip = true
            }            
            if(skip == false && present(post.link) && (type == "image" || type == "video")){
              if(type == "image") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.images.standard_resolution.url})   
              if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.videos.standard_resolution.url})         
              date = moment(post.created_time, 'X').format()
              text = post.caption != null ? post.caption.text : ''
              data = pushToArray(data, 'instagram', post.id, text, text, date, post.link)              
              ++j
            }      
          }
          console.log("got "+ j + " instagram posts")
        }
        callback(null, data, media)
      })
    },
    function(data, media, callback) {
      console.log("Pinterest posts.")      
      getPins(CREDENTIALS.pinterest.user_boards, 0, data, media, function(pinscount, _data, _media){
        console.log("got "+ pinscount + " pinterest posts.")
        callback(null, _data, _media)
      })      
    },
    function(data, media, callback) {
      console.log("twitter posts.")
      var j = 0
      params = { user_id: CREDENTIALS.twitter.brandId }
      if(latestTweetId != null){
        params.since_id = latestTweetId
      }
      twitter_client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (tweets && tweets.length > 0) {        
          for (var i = 0; i < tweets.length; i++) {        
            tweet = tweets[i]     
            if ((tweet.entities.media != undefined) && present(tweet.entities.media[0].expanded_url)){ // only media type photo
              media.push({itemid: tweet.id_str, mediatypeid: mediaTypes['photo'], mediaurl: tweet.entities.media[0].media_url})
              data = pushToArray(data, 'twitter', tweet.id_str, tweet.text, tweet.text, tweet.created_at, tweet.entities.media[0].expanded_url)
              j++
            }            
          }
        }
        console.log("got "+ j + " twitter posts")
        callback(null, data, media);
      });         
    },
    function(data, media, callback) {
      console.log("Youtube posts.")
      var  j = 0
      params = {
          part: 'id, snippet',
          type: 'video',
          channelId: CREDENTIALS.youtube.channelId,
          maxResults: 50,
          order: 'date',
          safeSearch: 'moderate',
          videoEmbeddable: true
      }
      if(youtubeLatestPuplishDate != null){
        params.publishedAfter = moment(youtubeLatestPuplishDate).format()
      }
      var request = youtubeV3.search.list(params,(err, response) => {
        var sourceID, title, description, sourceCreatedUTC, sourceUrl;
        if (response && response.items && response.items.length > 0) {
          result = response.items
          for (var i = 0; i < result.length; i++) {
             if(present(result[i].id.videoId)) {
              var snippet       = result[i].snippet
              sourceID          = result[i].id.videoId
              title             = snippet.title
              description       = snippet.description
              sourceCreatedUTC  = snippet.publishedAt
              sourceUrl = "https://www.youtube.com/watch?v="+sourceID
              media.push({itemid: sourceID, mediatypeid: mediaTypes['video'], mediaurl: sourceUrl})
              data = pushToArray(data, 'youtube', sourceID, title, description, sourceCreatedUTC, sourceUrl)
              j++
            }
          }          
        }
        console.log("got "+ j + " youtube posts")
        callback(null, data, media);
      });         
    },
    function(data, media, callback) { 
      console.log("tumblr posts.") // No specific parameter to get latest posts after a date or id.
      var j = 0;
      var tumblr = require('tumblr');
      var oauth = {
          consumer_key: CREDENTIALS.tumblr.consumer_key,
          consumer_secret: CREDENTIALS.tumblr.consumer_secret,
          token: CREDENTIALS.tumblr.token,
          token_secret: CREDENTIALS.tumblr.token_secret
      };      
      var blog = new tumblr.Blog(CREDENTIALS.tumblr.brandId, oauth);
      blog.posts({}, function(error, response) {        
          if (response.posts && response.posts.length > 0) {            
            result = response.posts
            for (var i = 0; i < result.length; i++) {
              post = result[i]
              type = post.type
              if(present(post.post_url) && (type == "photo" || type == "video") && (latestTumblerPostId == null || (latestTumblerPostId != null && post.id > latestTumblerPostId))) {
                if(type == "photo") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.photos[0].alt_sizes[0].url})
                if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.player[0].embed_code})
                data = pushToArray(data, 'tumblr', post.id, post.slug, post.caption, post.date, post.post_url)
                j++
              }
            }
          }
          console.log("got "+ j + " tumbler posts")
          callback(null, data, media);
      })
    },
    function(data, media, callback) {
      console.log("facebook posts.")
      var FB = require('fb');      
      var j = 0
      var params = { fields: "created_time, name, link, type, message, story, full_picture, source", access_token: CREDENTIALS.facebook.access_token }
      if(latestFacebookPostDate != null) params.since = latestFacebookPostDate
      FB.api(CREDENTIALS.facebook.brandId+'/feed', params, function(res) {                    
        if (res.data.length > 0) {          
          result = res.data          
          for (var i = 0; i < result.length; i++) { 
            post = result[i]
            if (present(post.link) && post.type != undefined && (post.type == "photo" || post.type == "video")){
              type = post.type
              if(type == "photo") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.full_picture})   
              if(type == "video") media.push({itemid: post.id, mediatypeid: mediaTypes[type], mediaurl: post.source})
              data = pushToArray(data, 'facebook', post.id, post.name, post.message, post.created_time, post.link)
              j++
            }
          }
        }
        console.log("got "+ j + " facebook posts")
        callback(null, data, media);
      })
    },
    function(data, media, callback) {
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
        if(data.length == 0){
          callback(null, data)
        }
          else{
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
                  callback(null, data)
                })
              })
            })            
          }
      })
    }
  ], function (err, result) {
      if(err) console.log(err)
      else    console.log("saved "+ result.length + " new posts.")
  })    
}

function getPins(boards, pinscount, data, media, cb){    
  if (boards.length == 0) cb(pinscount, data, media)
  else{
    var board = boards.pop()  
    console.log("fetch pinterest board : "+ board)
  try{
    pinterest.api('boards/' + board).then(function(_board) {       
      var title = _board.data.name
      pinterest.api('boards/' + board + '/pins',{ qs: {fields: 'id,created_at,note,link,image,media,attribution' }}).then(function(result) {       
        if (result.data.length > 0) {        
          result = result.data
          for (var i = 0; i < result.length; i++) {
            pin = result[i]            
            if(present(pin.link) && pin.media != undefined && (latestPinterestPostId == null || (latestPinterestPostId != null && moment(pin.created_at).diff(moment(latestPinterestPostId)) > 0 ))){  
              if(pin.media.type == 'image' && pin.image && pin.image.original != undefined){
                media.push({itemid: pin.id, mediatypeid: mediaTypes['image'], mediaurl: pin.image.original.url})   
              }
              if(pin.media.type == 'video' && pin.attribution != undefined){
                media.push({itemid: pin.id, mediatypeid: mediaTypes['video'], mediaurl: pin.attribution.url})   
              }
              data = pushToArray(data, 'pinterest', pin.id, title, pin.note, pin.created_at, pin.link)
              pinscount += 1
            }
          }
        }
          getPins(boards, pinscount, data, media, cb)  
        })
      })
    }
    catch (e){
        getPins(boards, pinscount, data, media, cb)  
    }
  }  
}
function present(argument) {
  return (argument != '' && argument != null && argument != undefined)
}
run()