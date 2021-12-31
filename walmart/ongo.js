const playwright = require('playwright');
const { default: axios } = require('axios');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925840818684723260/U-32YKxWInEbxksGxVvfwFTV2drL7JDfuBEkDd3WKtMB0PiZehIengi0bcon3Wsu9QcJ");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))
const config = []
config.push({"upc": "On-Go-COVID-19-Antigen-Self-Test-Tech-Enabled-At-Home-Covid-Test-OTC-Results-in-10-Minutes-2-Test-Kit/373165472", "brand": "on/go", "upcActual": "860006191665"})

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('ongo')){
    process.exit()
}

async function walmartAPI(){
  for (var i = 0; i < config.length; i++) {
    const browserType = playwright.webkit
    const browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://search.mobile.walmart.com/v1/products-by-code/UPC/" + config[i]["upcActual"]);
    await page.screenshot({ path: config[i]["upcActual"] + ".png" });
    const c = await page.content()
    const d = JSON.parse(c.replace("</pre></body></html>", "").replace('<html><head></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">', ""))
    const stock = d.data.online.inventory.available
    const price = d.data.online.price.priceInCents / 100
    const query = { store: "Walmart", storeID: "373165472" };
    const date = new Date().toISOString()
    await browser.close();
    console.log(stock)
    console.log(price)
    if(stock){
      Stock.count(query, function (err, count){
        if(count == 0){
          Stock.create({store: "Walmart", storeID: "373165472", isInStock: stock, lastUpdated: date, pricePer: price })
        }
        else{
          Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price }, {upsert: false}, function(err, doc) {});
        }
      })  
    }
    else{
      walmart()
    }
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + d.data.common.name + " is " + d.data.online.inventory.available)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    await timer(5000);
  }
}


async function walmart() {
    for (var i = 0; i < config.length; i++) {
      const browserType = playwright.webkit
      const browser = await browserType.launch({});
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("https://www.walmart.com/ip/" + config[i]["upc"]);
      await page.screenshot({ path: config[i]["upc"] + ".png" });
      const stock = await page.$("text='Add to cart'") !== null
      const price = await page.innerText('[itemprop="price"]', 'query')
      console.log(price)
      console.log(stock)
      const date = new Date().toISOString()
      const query = { store: "Walmart", storeID: config[i]["upc"].split('/')[1] };
      Stock.count(query, function (err, count){
        if(count == 0){
          Stock.create({store: "Walmart", storeID: config[i]["upc"].split('/')[1], isInStock: stock, lastUpdated: date, pricePer: price.replace('$',''), purchaseLink: "https://www.walmart.com/ip/" + config[i]["upc"]})
        }
        else{
          Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price.replace('$',''), purchaseLink: "https://www.walmart.com/ip/" + config[i]["upc"]}, {upsert: false}, function(err, doc) {});
        }
      })
      await browser.close();
      const embed = new MessageBuilder()
      .setTitle('COVID Test Stock Update')
      .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
      .setColor('#00b0f4')
      .setTimestamp();
      hook.send(embed);
      await timer(30000);
    }
  }

  var minutes = 5, the_interval = minutes * 60 * 1000;
setInterval(function() {
  walmartAPI()
}, the_interval);

walmartAPI()