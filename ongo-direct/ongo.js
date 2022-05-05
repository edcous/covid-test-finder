var request = require('request');
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))
var minutes = 120, the_interval = minutes * 60 * 1000;
const stores = process.env.storesToRun.toString().toLowerCase();
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/926558232837754931/mMfslkWyJM9uTJyWsSpJzolv1gIki2WNKD_gxOnElM-mMKz2pQsP0rj82W8VuIg8kNL8");

var headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': '*',
    'Host': 'shop.letsongo.com',
    'Origin': 'https://www.letsongo.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Safari/605.1.15',
    'Referer': 'https://www.letsongo.com/',
    'Content-Length': '1114',
    'Connection': 'keep-alive',
    'X-SDK-Variant': 'javascript',
    'X-Shopify-Storefront-Access-Token': 'e6cab912003a86fd1c45f6fc09131825',
    'X-SDK-Version': '2.12.0',
    'X-SDK-Variant-Source': 'buy-button-js'
};

var dataString = '{"query":"fragment VariantFragment on ProductVariant  { id,title,price,priceV2 { amount,currencyCode },presentmentPrices (first: 20) { pageInfo { hasNextPage,hasPreviousPage },edges { node { price { amount,currencyCode },compareAtPrice { amount,currencyCode } } } },weight,available: availableForSale,sku,compareAtPrice,compareAtPriceV2 { amount,currencyCode },image { id,src: originalSrc,altText },selectedOptions { name,value },unitPrice { amount,currencyCode },unitPriceMeasurement { measuredType,quantityUnit,quantityValue,referenceUnit,referenceValue } },fragment ProductFragment on Product  { id,availableForSale,createdAt,updatedAt,descriptionHtml,description,handle,productType,title,vendor,publishedAt,onlineStoreUrl,options { id,name,values },images (first: 250) { pageInfo { hasNextPage,hasPreviousPage },edges { cursor,node { id,src,altText } } },variants (first: 250) { pageInfo { hasNextPage,hasPreviousPage },edges { cursor,node { ...VariantFragment } } } },query ($id:ID!)  { node (id: $id) { __typename,...ProductFragment } }","variables":{"id":"Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0LzY5Mjg3MjAwMDMyMjY="}}';

var options = {
    url: 'https://shop.letsongo.com/api/2021-07/graphql',
    method: 'POST',
    headers: headers,
    body: dataString
};

if(!stores.includes('direct-o-n-g-o')){
    process.exit()
}

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        const data = JSON.parse(body)
        const stock = data.data.node.variants.edges[0].node.available
        const price = data.data.node.variants.edges[0].node.price
        const date = new Date().toISOString()
        const query = {store: "On/Go Direct", storeID: "og-d-1"}
        console.log('ok')
        Stock.count(query, function (err, count){
            console.log('ok yo')
            if(count == 0){
              Stock.create({store: "On/Go Direct", storeID: 'og-d-1', isInStock: stock, lastUpdated: date, pricePer: price })
            }
            else{
              Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price}, {upsert: false}, function(err, doc) {});
            }
          })
          const embed = new MessageBuilder()
          .setTitle('COVID Test Stock Update')
          .setDescription('Stock on item :' + 'on/go' + " is " + stock)
          .setColor('#00b0f4')
          .setTimestamp();
          hook.send(embed);
    }
    else{
        console.log(response)
        console.log(error)
    }
}
function ongo(){
    request(options, callback);
}

setInterval(function() {
    ongo()
}, the_interval);