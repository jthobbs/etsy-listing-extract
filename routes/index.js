var express = require('express');
var router = express.Router();
var decode = require('unescape');
var Json2csvParser = require('json2csv').Parser;
var Client = require('node-rest-client').Client;

router.get('/', function (req, res, next) {
	// var url = 'https://etsy-listing-extract.herokuapp.com/shopid';
	res.render('index', {
		url: url
	});
});

router.get('/shop', function (req, res, next) {
	var shopName = req.query.shop_name;
	var url = 'https://openapi.etsy.com/v2/shops?shop_name=' + shopName + '&api_key=kt5f7zlun66009cyfp79p1cn';

	var client = new Client();
	client.get(url, function (data, response) {
		if (data) {

			var shopId = data.results[0].shop_id;
			var baseUrl = 'https://etsy-listing-extract.herokuapp.com';
			var relativeUrl = '/' + shopId + '/listings';
			res.render('shop', {
				relativeUrl: relativeUrl,
				fullUrl: baseUrl + '' + relativeUrl
			});
		}
	});

});

/* GET home page. */
router.get('/:shopId/listings', function (req, res, next) {
	var shopId = req.params.shopId;
	var apiKey = req.query.apikey;
	if (!apiKey) {
		// hardcoded api key
		apiKey = 'kt5f7zlun66009cyfp79p1cn';
	}
	var fields = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
	var listings = [];

	var client = new Client();
	//https://openapi.etsy.com/v2/shops/11395425/listings/active?api_key=kt5f7zlun66009cyfp79p1cn?replaceDomain=etsy.com&replaceWith=beautifulchaosshoppe.com&brand=Beautiful Chaos
	var etsyUrl = 'https://openapi.etsy.com/v2/shops/' + shopId + '/listings/active?api_key=' + apiKey;
	client.get(etsyUrl, function (data, response) {
		if (data) {
			var count = data.count;
			etsyUrl = 'https://openapi.etsy.com/v2/shops/' + shopId + '/listings/active?includes=MainImage&limit=' + count + '&api_key=' + apiKey;
			client.get(etsyUrl, function (data, response) {
				for (var i = 0; i < data.results.length; i++) {
					var result = data.results[i];

					var listing = {};
					listing.id = result.listing_id;
					listing.title = decode(result.title);
					listing.description = decode(result.description);
					listing.availability = 'in stock';
					listing.condition = 'new';
					listing.price = result.price + ' ' + result.currency_code;
					var link = result.url;
					var replaceDomain = req.query.replaceDomain;
					var replaceWith = req.query.replaceWith;
					if (replaceDomain && replaceWith && link.includes(replaceDomain)) {
						// link = link.replaceAll(replaceDomain, replaceWith);
						link = link.replace(replaceDomain, replaceWith);
					}
					listing.link = link;
					listing.image_link = result.MainImage.url_fullxfull;
					listing.brand = 'Beautiful Chaos';
					listings.push(listing);
				}

				var responseType = req.query.responseType;
				if (responseType && responseType == 'json') {
					response.send(listings);
				} else {
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
		} else {
			// no data
			console.log('no data');
		}

	});

});

module.exports = router;