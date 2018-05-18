var express = require('express');
var router = express.Router();
var Json2csvParser = require('json2csv').Parser;

var Client = require('node-rest-client').Client;

/* GET home page. */
router.get('/:shopId/listings', function(req, res, next) {
	var shopId = req.params.shopId;
	var apiKey = req.query.apikey;
	var client = new Client();
	var fields = ['sku', 'title', 'description', 'availability', 'condition', 'price', 'url', 'image_url', 'brand'];
	var listings = [];
	var url = 'https://openapi.etsy.com/v2/shops/' + shopId + '/listings/active?api_key=' + apiKey;
	var imgCalls = 0;
	var listingMap = {};
	client.get(url, function(data, response) {
		for (var i = 0; i < data.results.length; i++) {
			var result = data.results[i];

			var listing = {};
			listing.sku = result.listing_id;
			listing.title = result.title;
			listing.description = result.description;
			listing.availability = 'in stock';
			listing.condition = 'new';
			listing.price = result.price + ' ' + result.currency_code;
			listing.url = result.url;
			listing.brand = 'Beautiful Chaos';
			listingMap[result.listing_id] = listing;
			// listings.push(listing);

			// https://openapi.etsy.com/v2/listings/504394946/images?api_key=kt5f7zlun66009cyfp79p1cn
			var imgUrl = 'https://openapi.etsy.com/v2/listings/' + result.listing_id + '/images?api_key=' + apiKey;
			// console.log(imgUrl);
			client.get(imgUrl, function(data2, response2) {
				imgCalls++;
				if (data2.results) {
					var img = data2.results[0];
					var listing = listingMap[img.listing_id];
					// get the images
					listing.image_url = img.url_fullxfull;
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
				}

			});
		}

	});

});

module.exports = router;
