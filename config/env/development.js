module.exports = {
    "db_url": 'postgres://postgres:postgres@localhost:5432/aggregator',
    "schedule": {
        "time": "*/2 * * * *"
    },
    "youtube": {
        "client_id": "961078331124-3kj7q6o23svft2hgup9e560nd375j2uj.apps.googleusercontent.com",
        "project_id": "content-api-aggregator",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "oPVcJ8t4X1gFe9HVyiCjPE20",
        "redirect_uris": [
            "http://localhost:5000/redirect"
        ],
        "javascript_origins": [
            "http://localhost:5000"
        ],
        "version": "v3",
        "api_key": "AIzaSyDmKGzZl_xYAeJCQJBRaVw7-fqSkaMfzN8",
        "channelId": "UCu16y62LPCwTknfV5_7Zalg"
    },
    "instagram": {
        "client_id": "53869dfbab1d4910af79f033e747667b",
        "client_secret": "5e8ad9e241cf4439a3d5d956af3da0bb",
        "access_token": "3263523015.a8ac72b.68373503ac734c87a6d2c248891f5afa",
        "userName": "cartier",
        "brandId": "2043104068"
    },
    "facebook": {
        "appId": "250888108604304",
        "appSecret": "c9d29d3499b6a6a7dc2d10bc71509e76",
        "access_token": "EAALtwStZCbE8BAOb6JMS8V6puavzyPt9pyUIOIrWeTPqV8adyEvvaiGPRTchIhoZA6cfh02bNXMQJWPFrrmJ6JQy6oPOE9chbJNLhEOEwCxGuz9VutR2F66kmNIClV8UPHEQoKhQCzGgZAuq9w6ljvxMZABPrM0ZD",
        "redirectUri": "http://localhost",
        "version": "v2.6",
        "brandId": "303914963119085"
    },
    "tumblr": {
        "consumer_key": "c8NcM2hXUIffxB1poirzO2OfI4KWxaGr103git9VfiDOFKjDHh",
        "consumer_secret": "fRGAm5xxHk7ilcuxvQtROmNJPc4UB9Z7b9dgnSlpCVwoabHdvU",
        "token": "Tnd906q60zYXOpYJI2goG6ppUsZZepGhO34Kh6uu3rUAP5hqAg",
        "token_secret": "7jJNh27rGX905HRh6xTcbGWYiPMX5QoTbhFezN4OUy36SJhEJL",
        "brandId": "cartier.tumblr.com"
    },
    "pinterest": {
        "token": "AbIdhc_uwdqS1_gQhUDZO94WQeLHFFWHVFSdcsRDH3KAAoAqRAAAAAA",
        "appId": "4836125079951655295",
        "appSecret": "5649b1fd57c762fdae1547c33069b2a5b1bb59813daed5ca70feed1211383afe",
        "userName": "cartier",
        "user_boards": ["cartier/calibre-de-cartier-diver", "cartier/jeanne-toussaint-louis-cartier-collection", "cartier/winter-tale-gifts-selection","cartier/cartier-id-two-concept-watch", "cartier/juste-un-clou"]
    },
    "twitter": {
        "consumer_key": "gOWZTWEdLocq05v8vdsnKtRYd",
        "consumer_secret": "Hn6uHZRYkMxHTfscYcnthldWL7HQesndekPGioG85AX2FYnCb2",
        "owner": "proximity_demo",
        "owner_id": "734776701255876608",
        "access_token": "734776701255876608-VzGYRsmrEwxDuVIXNIs26SA79QjKQJf",
        "access_token_secret": "imPmm2yIW5NEDCa6ni1H7EJunuAwKRdmOunkswFJsVaG8",
        "brandId": "60659498"
    }
}
