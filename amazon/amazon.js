const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/927304279214145577/rC8CqB2AnB0fXI82VCDo7aN-Tar8K5_2XgVh1VasQoI-pxFQ5eQqUmp6nilBLTpbeJiv");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

const config = JSON.parse(fs.readFileSync('./amazon/tests.json', 'utf8'))
require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('amazon')){
    process.exit()
}

async function amazon() {
  for (var i = 0; i < config.length; i++) {
    const browserType = playwright.webkit
    const browser = await browserType.launch({});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.amazon.com/dp/" + config[i]["id"]);
    await timer(5000);
    const stock = await page.$('[id="add-to-cart-button"]') !== null
    var price;
    if(stock){
        price = await page.innerText('[class="a-offscreen"]')
    }
    const date = new Date().toISOString()
    const query = { store: "Amazon", storeID: config[i]["id"] };
    await page.screenshot({ path: './' + config[i]["id"] + ".png" });
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Amazon", storeID: config[i]["id"], isInStock: stock, lastUpdated: date, pricePer: parseInt(price), purchaseLink: "https://www.amazon.com/dp/" + config[i]["id"]})
      }
      else{
            if(!stock){
                Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
            }
            else{
                Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price.replace('$','')}, {upsert: false}, function(err, doc) {});
            }
            console.log(price)
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + config[i]["name"] + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    hook.sendFile('./' + config[i]["id"] + ".png")
    await timer(60000);
  }
}

var minutes = 5, the_interval = minutes * 60 * 1000;

setInterval(function() {
  amazon()
}, the_interval);