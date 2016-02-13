'use strict';

// imagesearch routes

const wrap = require('wrap-fn');
const request = require('request');

module.exports = (app, router, collection) => {
	// Latest searches
	router.get('/latest/imagesearch', (req, res) => {
		return wrap(function* (req, res) {
			let searches = yield collection.find({}, { _id: 0 }).sort({ when: -1 }).limit(10).toArray();

			return res.json(searches);
		})(req, res);
	});

	// Hangle Google CSE
	router.get('/imagesearch/:term?', (req, res) => {
		return wrap(function* (req, res) {
			// Friendly error with no term
			if (!req.params.term) {
				return res.json({
					error: 'Provide a valid search term'
				});
			}

			let term = req.params.term;
			// Must be positive
			let offset = req.query.offset || 1;
			let url = `${app.get('searchUrl')}&start=${offset}&q=${term}`;

			request(url, (err, response, body) => {
				return wrap(function* (err, response, body) {
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

					// Save search
					try	{
						yield collection.insertOne({
							term: term,
							when: (new Date()).toISOString()
						});
					} catch (err) {
						console.error(err);
						throw err;
					}

					res.json(results);
				})(err, response, body);
			});
		})(req, res);
	});
};