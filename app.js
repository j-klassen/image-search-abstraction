'use strict';

// Free Code Camp - Image Search Abstraction Project
// Using Google Custom Search Engine API

require('dotenv').config();

const request = require('request');
const express = require('express');
const app = express();
const morgan = require('morgan');

const searchUrl = `${env('GOOGLE_CSE_URL')}` +
									`?key=${env('GOOGLE_CSE_KEY')}` +
									`&cx=${env('GOOGLE_CSE_CX')}` +
									`&searchType=${env('GOOGLE_CSE_SEARCH_TYPE')}` +
									`&num=${env('GOOGLE_CSE_NUM')}` +
									`&fields=${env('GOOGLE_CSE_FIELDS')}`;

app.use(morgan('dev'));

const router = express.Router();

// Hangle Google CSE
router.get('/imagesearch/:term?', (req, res) => {

	// Friendly error if we have no term
	if (!req.params.term) {
		return res.json({
			message: 'Provide a search term'
		});
	}

	let term = req.params.term;
	// Must be positive
	let offset = req.query.offset || 1;
	let url = `${searchUrl}&start=${offset}&q=${term}`;

	request(url, (err, response, body) => {
		body = JSON.parse(body);

		if (err) {
			return res.json({
				error: err
			});
		}

		if (body && body.error) {
			return res.json({
				error: body.error
			});
		}

		// Format response
		let results = body.items;
		results = results.map((item) => {
			return {
				url: item.link,
				snippet: item.snippet,
				thumbnail: item.image.thumbnailLink,
				context: item.image.contextLink
			};
		});

		res.json(results);
	});
});

app.use('/api', router);

app.listen(process.env.PORT || 3000, () => {
	console.log(`server listening on port ${process.env.PORT}`);
});

/**
 * Lookup key in process.env
 * @param {string} key - Key to be looked up
 * @returns {string}
 */
function env(key) {
	return process.env[key];
}