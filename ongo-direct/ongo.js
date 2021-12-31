var request = require('request');
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))
var minutes = 5, the_interval = minutes * 60 * 1000;
const stores = process.env.storesToRun.toString().toLowerCase();
var headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': '*',
    'Host': 'shop.letsongo.com',
    'Origin': 'https://www.letsongo.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
    'Referer': 'https://www.letsongo.com/',
    'Content-Length': '3307',
    'Connection': 'keep-alive',
    'X-SDK-Variant': 'javascript',
    'X-Shopify-Storefront-Access-Token': 'e6cab912003a86fd1c45f6fc09131825',
    'X-SDK-Version': '2.12.0',
    'X-SDK-Variant-Source': 'buy-button-js'
};

var dataString = '{"query":"fragment VariantFragment on ProductVariant  { id,title,price,priceV2 { amount,currencyCode },presentmentPrices (first: 20) { pageInfo { hasNextPage,hasPreviousPage },edges { node { price { amount,currencyCode },compareAtPrice { amount,currencyCode } } } },weight,available: availableForSale,sku,compareAtPrice,compareAtPriceV2 { amount,currencyCode },image { id,src: originalSrc,altText },selectedOptions { name,value },unitPrice { amount,currencyCode },unitPriceMeasurement { measuredType,quantityUnit,quantityValue,referenceUnit,referenceValue } },fragment DiscountApplicationFragment on DiscountApplication  { __typename,targetSelection,allocationMethod,targetType,value { ... on MoneyV2 { amount,currencyCode },... on PricingPercentageValue { percentage } },... on ManualDiscountApplication { title,description },... on DiscountCodeApplication { code,applicable },... on ScriptDiscountApplication { description },... on AutomaticDiscountApplication { title } },fragment AppliedGiftCardFragment on AppliedGiftCard  { amountUsedV2 { amount,currencyCode },balanceV2 { amount,currencyCode },presentmentAmountUsed { amount,currencyCode },id,lastCharacters },fragment VariantWithProductFragment on ProductVariant  { ...VariantFragment,product { id,handle } },fragment MailingAddressFragment on MailingAddress  { id,address1,address2,city,company,country,firstName,formatted,lastName,latitude,longitude,phone,province,zip,name,countryCode: countryCodeV2,provinceCode },fragment CheckoutFragment on Checkout  { id,ready,requiresShipping,note,paymentDue,paymentDueV2 { amount,currencyCode },webUrl,orderStatusUrl,taxExempt,taxesIncluded,currencyCode,totalTax,totalTaxV2 { amount,currencyCode },lineItemsSubtotalPrice { amount,currencyCode },subtotalPrice,subtotalPriceV2 { amount,currencyCode },totalPrice,totalPriceV2 { amount,currencyCode },completedAt,createdAt,updatedAt,email,discountApplications (first: 10) { pageInfo { hasNextPage,hasPreviousPage },edges { node { __typename,...DiscountApplicationFragment } } },appliedGiftCards { ...AppliedGiftCardFragment },shippingAddress { ...MailingAddressFragment },shippingLine { handle,price,priceV2 { amount,currencyCode },title },customAttributes { key,value },order { id,processedAt,orderNumber,subtotalPrice,subtotalPriceV2 { amount,currencyCode },totalShippingPrice,totalShippingPriceV2 { amount,currencyCode },totalTax,totalTaxV2 { amount,currencyCode },totalPrice,totalPriceV2 { amount,currencyCode },currencyCode,totalRefunded,totalRefundedV2 { amount,currencyCode },customerUrl,shippingAddress { ...MailingAddressFragment },lineItems (first: 250) { pageInfo { hasNextPage,hasPreviousPage },edges { cursor,node { title,variant { ...VariantWithProductFragment },quantity,customAttributes { key,value } } } } },lineItems (first: 250) { pageInfo { hasNextPage,hasPreviousPage },edges { cursor,node { id,title,variant { ...VariantWithProductFragment },quantity,customAttributes { key,value },discountAllocations { allocatedAmount { amount,currencyCode },discountApplication { __typename,...DiscountApplicationFragment } } } } } },query ($id:ID!)  { node (id: $id) { __typename,...CheckoutFragment } }","variables":{"id":"Z2lkOi8vc2hvcGlmeS9DaGVja291dC8wYjJkM2NiMmE2NmEwOGRjOTk0OWY1OWUxZTJmZDBiMz9rZXk9NjBkYTJiYmZiNDQ0Njg3YmQyZjZkYzI1YmQzMDQ3NjM="}}';

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
        const stock = data.data.node.lineItems.edges[0].node.variant.available
        const price = data.data.node.lineItems.edges[0].node.variant.price
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
    }
}
function ongo(){
    request(options, callback);
}

setInterval(function() {
    ongo()
}, the_interval);