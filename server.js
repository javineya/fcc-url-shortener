'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require( 'body-parser' );

const app = express();

const port = process.env.PORT || 3000;
const dbShortURL = require( './modelShortURL.js' );

app.use(cors());
app.use(bodyParser.json());

mongoose.connect( process.env.MONGO_URI, {useNewUrlParser: true} );

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get( "/new/:longURL(*)", ( req, res, next ) => {
	const regex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
	let { longURL } = req.params;

	if( regex.test( longURL ) === true ) {
		let shortURL = Math.floor( Math.random() * 1000 ).toString();
		let data = new dbShortURL({
			longURL: longURL,
			shortURL: shortURL
		});
    
		data.save( error => {
			if( error ) {
				return res.send( 'Error saving to database.' );
			}
		});
    
		return res.json( data );
	}

	let data = new dbShortURL({
		longURL: 'URL invalid.',
		shortURL: 'Unable to parse invalid URL.'
	});

	return res.json( data );
});

app.get( "/:urlToForward", ( req, res, next ) => {
	let shortURL = req.params.urlToForward;

	dbShortURL.findOne({
		'shortURL': shortURL
	}, ( error, data ) => {
		if ( error ) {
			return res.send( 'Error in database.' );
		}

		let urlPrefixRegex = new RegExp( "^(http|https)://", "i" );
		let urlToCheck = data.longURL;

		if ( urlPrefixRegex.test( urlToCheck )) {
			res.redirect( 200, data.longURL );
      
		} else {
			res.redirect( 200, 'http://' + data.longURL );
      
		}
	});
});

app.listen(port, () => console.log( 'Node.js listening ...' ));
