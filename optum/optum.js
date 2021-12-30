const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925840818684723260/U-32YKxWInEbxksGxVvfwFTV2drL7JDfuBEkDd3WKtMB0PiZehIengi0bcon3Wsu9QcJ");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

const config = JSON.parse(fs.readFileSync('./optum/tests.json', 'utf8'))
require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('optum')){
    process.exit()
}

async function optum() {
  for (var i = 0; i < config.length; i++) {
    const browserType = playwright.webkit
    const browser = await browserType.launch({headless:false});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://store.optum.com/shop/products/" + config[i]["upc"]);
    await page.screenshot({ path: config[i]["upc"] + ".png" });
    await timer(3000);
    const stock = await page.$("text='Add to Cart'") !== null
    console.log(stock)
    const date = new Date().toISOString()
    const query = { store: "Optum", storeID: config[i]["upc"] };
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Optum", storeID: config[i]["upc"], isInStock: stock, lastUpdated: date, purchaseLink: "https://store.optum.com/shop/products/" + config[i]["upc"]})
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, purchaseLink: "https://store.optum.com/shop/products/" + config[i]["upc"]}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    await timer(5000);
  }
}

var minutes = 5, the_interval = minutes * 60 * 1000;

setInterval(function() {
  optum()
}, the_interval);

optum()