const { default: axios } = require('axios');
const fs = require('fs')
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
const config = JSON.parse(fs.readFileSync('./target/tests.json', 'utf8'))
var minutes = 5, the_interval = minutes * 60 * 1000;
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925941695277834240/EkG605lE55_LXLSX3HfIJVIq46r5bZjBIXv6FthF8cnStKInXEoUmKrL24C8z8qIBr6M");
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

var x;
(async () => {
    await timer(2000)
    for (var i = 0; i < config.length; i++) {
        const sku = config[i]["sku"]
        const date = new Date().toISOString()
        console.log(sku)
        const res = await axios.get('https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?key=ff457966e64d5e877fdbad070f276d18ecec4a01&tcin=' + sku + '&store_id=2255&store_positions_store_id=2255&has_store_positions_store_id=true&zip=63664&state=MO&latitude=37.930&longitude=-90.780&pricing_store_id=2255&has_pricing_store_id=true&is_bot=false')
        const stock = res.data.data.product.fulfillment.shipping_options.availability_status != "OUT_OF_STOCK"
        const query = { store: "Target", storeID: sku };
        Stock.count(query, function (err, count){
            if(count == 0){
                Stock.create({store: "Target", storeID: sku, isInStock: stock, lastUpdated: date})
            }
            else{
                Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
            }
          })
          const embed = new MessageBuilder()
          .setTitle('COVID Test Stock Update')
          .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
          .setColor('#00b0f4')
          .setTimestamp();
          hook.send(embed);
          await timer(5000)
    }
})();

setInterval(function() {
    (async () => {
        await timer(2000)
        for (var i = 0; i < config.length; i++) {
            const sku = config[i]["sku"]
            const date = new Date().toISOString()
            console.log(sku)
            const res = await axios.get('https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?key=ff457966e64d5e877fdbad070f276d18ecec4a01&tcin=' + sku + '&store_id=2255&store_positions_store_id=2255&has_store_positions_store_id=true&zip=63664&state=MO&latitude=37.930&longitude=-90.780&pricing_store_id=2255&has_pricing_store_id=true&is_bot=false')
            const stock = res.data.data.product.fulfillment.shipping_options.availability_status != "OUT_OF_STOCK"
            const query = { store: "Target", storeID: sku };
            Stock.count(query, function (err, count){
                if(count == 0){
                    Stock.create({store: "Target", storeID: sku, isInStock: stock, lastUpdated: date})
                }
                else{
                    Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
                }
              })
              const embed = new MessageBuilder()
              .setTitle('COVID Test Stock Update')
              .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
              .setColor('#00b0f4')
              .setTimestamp();
              hook.send(embed);
              await timer(5000)
        }
    })();
}, the_interval);
  