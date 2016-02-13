'use strict';

// Free Code Camp - Image Search Abstraction Project
// Using Google Custom Search Engine API

require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const co = require('co');
const express = require('express');
const app = express();
const morgan = require('morgan');

// Setup Google CSE search url
const searchUrl = `${env('GOOGLE_CSE_URL')}` +
									`?key=${env('GOOGLE_CSE_KEY')}` +
									`&cx=${env('GOOGLE_CSE_CX')}` +
									`&searchType=${env('GOOGLE_CSE_SEARCH_TYPE')}` +
									`&num=${env('GOOGLE_CSE_NUM')}` +
									`&fields=${env('GOOGLE_CSE_FIELDS')}`;

app.set('searchUrl', searchUrl);
app.set('env', env('NODE_ENV') || 'development');

// Local mongo variables
if (app.get('env') === 'development') {
	app.set('MONGO_HOST', env('MONGO_HOST'));
	app.set('MONGO_DB', env('MONGO_DB'));
}

app.set('MONGO_COLLECTION', env('MONGO_COLLECTION'));

app.use(morgan('dev'));

co(function* run() {
	const routes = require('./routes');
	let mongoUrl;

	if (app.get('env') === 'development') {
		mongoUrl = `mongodb://${app.get('MONGO_HOST')}/${app.get('MONGO_DB')}`;
	} else if (app.get('env') === 'production') {
		mongoUrl = env('MONGOLAB_URI');
	}

	let db;
	let collection;

	try {
		db = yield MongoClient.connect(mongoUrl);
		collection = db.collection(app.get('MONGO_COLLECTION'));
	} catch (err) {
		console.error(err);
		throw err;
	}

	const router = express.Router();
	routes.imagesearch(app, router, collection);

	app.use('/api', router);

	app.listen(env('PORT') || 3000, () => {
		console.log(`server listening on port ${env('PORT')}`);
	});
});

/**
 * Lookup key in process.env
 * @param {string} key - Key to be looked up
 * @returns {string}
 */
function env(key) {
	return process.env[key];
}