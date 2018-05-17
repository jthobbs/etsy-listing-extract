var express = require('express');
var router = express.Router();
var Json2csvParser = require('json2csv').Parser;

var Client = require('node-rest-client').Client;


/* GET home page. */
router.get('/', function(req, res, next) {

	var client = new Client();
	client.get('https://openapi.etsy.com/v2/shops/11395425/listings/active?api_key=kt5f7zlun66009cyfp79p1cn', function(data, response) {
		// parsed response body as js object
		res.render('index', {
			test: response
		});

	});

});

/* GET home page. */
router.get('/:shopId/listings', function(req, res, next) {
	var shopId = req.params.shopId;
	var apiKey = req.query.apikey;
	var client = new Client();
	var fields = ['sku', 'title', 'description', 'price', 'url', 'image_url', 'availability', 'condition'];
	var listings = [];
	var url = 'https://openapi.etsy.com/v2/shops/' + shopId + '/listings/active?api_key=' + apiKey;
	var imgCalls = 0;
	client.get(url, function(data, response) {
		for (var i = 0; i < data.results.length; i++) {
			var result = data.results[i];

			// https://openapi.etsy.com/v2/listings/504394946/images?api_key=kt5f7zlun66009cyfp79p1cn
			var imgUrl = 'https://openapi.etsy.com/v2/listings/' + result.listing_id + '/images?api_key=' + apiKey;
			// console.log(imgUrl);
			client.get(imgUrl, function(data2, response2) {
				imgCalls++;
				if (data2.results) {
					var img = data2.results[0];
					// get the images
					var listing = {};
					listing.sku = result.listing_id;
					listing.title = result.title;
					listing.description = result.description;
					listing.price = result.price + ' ' + result.currency_code;
					listing.url = result.url;
					listing.image_url = img.url_fullxfull;
					listing.availability = 'in stock';
					listing.condition = 'new';
					listings.push(listing);
				}

				if (imgCalls == data.results.length) {
					const json2csvParser = new Json2csvParser({
						fields
					});
					const csv = json2csvParser.parse(listings);

					let file = Buffer.from(csv, 'utf8');

					res.writeHead(200, {
						'Content-Type': 'text/csv',
						'Content-disposition': `attachment; filename=listings.csv`,
						'Content-Length': file.length
					});

					res.end(file);
				} else {
					console.log('nope');
				}

			});
		}

	});

});

module.exports = router;
