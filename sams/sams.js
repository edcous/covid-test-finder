const { default: axios } = require('axios');
const fs = require('fs')
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
var config = []
var minutes = 10, the_interval = minutes * 60 * 1000;
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/926665385971945483/OE6xbv4G2SD2Wk2pXtaufDbWCBjKIjJ2Bbwpd2_hbTCNwoqnKOSQ4cgXvxh-nBKB8-na");
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('sams')){
    process.exit()
}

if(stores == 'sams1'){
    config.push({"sku": "prod25201058","name": "sams flu + covid combo"})
}
else if(stores == 'sams2'){
    config.push({"sku": "prod25790850","name": "binax now"})
}
else{
    config.push({"sku": "prod26491910","name": "on/go"})
}

async function sams(){
    for (var i = 0; i < config.length; i++) {
        const sku = config[i]["sku"]
        const date = new Date().toISOString()
        console.log(sku)
        const url = 'https://www.samsclub.com/api/node/vivaldi/browse/v2/products?includeOptical=true'
        const data = {"productIds":[config[i]["sku"]],"type":"LARGE","clubId":6444} 
        const res = await axios.post(url, data)
        const stock = res.data.payload.products[0].skus[0].onlineOffer.inventory.status == "AVAILABLE"
        const price = res.data.payload.products[0].skus[0].onlineOffer.price.finalPrice.amount
        const query = { store: "Sam's Club", storeID: sku };
        Stock.count(query, function (err, count){
            if(count == 0){
                Stock.create({store: "Sam's Club", storeID: sku, isInStock: stock, lastUpdated: date, pricePer: price})
            }
            else{
                Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price}, {upsert: false}, function(err, doc) {});
            }
          })
          const embed = new MessageBuilder()
          .setTitle('COVID Test Stock Update')
          .setDescription('Stock on item :' + config[i]["name"] + " is " + stock)
          .setColor('#00b0f4')
          .setTimestamp();
          hook.send(embed);
    }
}

setInterval(function() {
    sams()
}, the_interval);