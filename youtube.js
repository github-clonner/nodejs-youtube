/*
	youtube-data / nodejs-youtube
	
	Node.js module to access YouTube data resources.
	
	This code is released as COPYLEFT, meaning you can do anything
	with it except copyrighting it. If possible it would be nice to
	include the source URL with the code for future reference:
	
	https://github.com/fvdm/nodejs-youtube
*/

var	https = require('https'),
	EventEmitter = require('events').EventEmitter,
	querystring = require('querystring')

var app = new EventEmitter()


///////////
// FEEDS //
///////////

app.feeds = {
	
	// Videos
	videos: function( vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'GET', 'feeds/api/videos', vars, cb )
	},
	
	// Related videos
	related: function( videoid, cb ) {
		app.talk( 'GET', 'feeds/api/videos/'+ videoid +'/related', cb )
	},
	
	// Responses
	responses: function( videoid, cb ) {
		app.talk( 'GET', 'feeds/api/videos/'+ videoid +'/responses', cb )
	},
	
	// One video
	video: function( videoid, cb ) {
		
		if( typeof cb == 'function' ) {
			app.talk( 'GET', 'feeds/api/videos/'+ videoid, cb )
		}
		
		// video shortcuts
		return {
			
			details: function( fcb ) {
				app.feeds.video( videoid, fcb )
			},
			
			related: function( fcb ) {
				app.feeds.related( videoid, fcb )
			},
			
			responses: function( fcb ) {
				app.feeds.responses( videoid, fcb )
			}
			
		}
		
	},
	
	// Standard feed
	// https://developers.google.com/youtube/2.0/reference#Standard_feeds
	// feeds.standard( 'most_recent', console.log )
	// feeds.standard( 'NL/top_rated_News', {time: 'today'}, console.log )
	standard: function( feed, vars, cb ) {
		
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		
		app.talk( 'GET', 'feeds/api/standardfeeds/'+ feed, vars, cb )
	},
	
	// User
	user: {
		
		// Favorites
		favorites: function( userid, vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.talk( 'GET', 'feeds/api/users/'+ userid +'/favorites', vars, cb )
		}
		
	}
	
}


/////////////////
// COMMUNICATE //
/////////////////

app.talk = function( type, path, fields, cb, normalJSON ) {
	
	// fix callback
	if( !cb && typeof fields == 'function' ) {
		var cb = fields
		var fields = {}
	}
	
	// fix fields
	if( !fields || typeof fields != 'object' ) {
		var fields = {}
	}
	
	// force JSON-C and version
	fields.alt = normalJSON ? 'json' : 'jsonc'
	fields.v = 2
	
	// prepare
	var requestHeaders = {
		'User-Agent':	'youtube-api.js (https://github.com/fvdm/nodejs-youtube)',
		'Accept':		'application/json'
	}
	
	var query = querystring.stringify( fields )
	
	doPost = false
	if( type.match( /(POST|DELETE|PUT)/ ) ) {
		doPost = true
		requestHeaders['Content-Type'] = 'applications/x-www-form-urlencoded'
		requestHeaders['Content-Length'] = query.length
	} else {
		path += '?'+ query
	}
	
	var options = {
		hostname:		'gdata.youtube.com',
		port:			443,
		path:			'/'+ path,
		headers:		requestHeaders,
		method:			type,
		agent:			false
	}
	
	// request
	var request = https.request( options, function( response ) {
		
		// response
		response.setEncoding('utf8')
		var data = ''
		
		response.on( 'data', function( chunk ) { data += chunk })
		response.on( 'end', function() {
			
			// validate
			if( data.length >= 2 && data.substr(0,1) == '{' && data.substr( data.length -1, 1 ) == '}' ) {
				
				// ok
				data = JSON.parse( data )
				if( normalJSON ) {
					cb( data, response.headers )
				} else if( data.data ) {
					cb( data.data, response.headers )
				}
				
			}
			
		})
		
	})
	
	// post & do it
	if( doPost ) {
		request.send( query )
	}
	
	request.end()
	
}

// ready
module.exports = app