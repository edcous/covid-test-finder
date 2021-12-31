const { default: axios } = require('axios');
const fs = require('fs')
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
const config = JSON.parse(fs.readFileSync('./target/tests.json', 'utf8'))
var minutes = 5, the_interval = minutes * 60 * 1000;
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/926599467568861194/V852pT9ktLp7wwiYbSkedbpn-lCguKt7ueMdYqp0Pv-jOTIfrwPQ0r9OOzgJ-K5wE0b0");
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('ihealth')){
    process.exit()
}

async function ihealth(){
    const res = await axios.get('https://ihealthlabs.com/products.json')
    for(i in res.data.products){
        if(res.data.products[i].title == 'iHealth COVID-19 Antigen Rapid Test' && res.data.products[i].variants.length == 1){
            const stock =res.data.products[i].variants[0].available
            const date = new Date().toISOString()
            const sku = res.data.products[i].id
            const price = res.data.products[i].variants[0].price
            const query = { store: "iHealthLabs Direct", storeID: sku };
            Stock.count(query, function (err, count){
                if(count == 0){
                    Stock.create({store: "iHealthLabs Direct", storeID: sku, isInStock: stock, lastUpdated: date, pricePer: price})
                }
                else{
                    Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price}, {upsert: false}, function(err, doc) {});
                }
              })
              const embed = new MessageBuilder()
              .setTitle('COVID Test Stock Update')
              .setDescription('Stock on item :' + 'ihealth labs' + " is " + stock)
              .setColor('#00b0f4')
              .setTimestamp();
              hook.send(embed);
            }
    }
}

setInterval(function() {
    ihealth()
}, the_interval);