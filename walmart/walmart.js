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
var config = JSON.parse(fs.readFileSync('./walmart/tests.json', 'utf8'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('ongo')){
    process.exit()
}

if(stores.includes('walmart')){
  config = config[3]
  console.log(config)
}

async function walmart() {
    if(config.length=1){
      const browserType = playwright.webkit
      const browser = await browserType.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("https://www.walmart.com/ip/" + config["upc"]);
      await page.screenshot({ path: './' + config["upc"].split('/')[1] + ".png" });
      const stock = await page.$("text='Add to cart'") !== null && (await page.$("text='Shipping, '") !== null || await page.$("text='Free shipping, '") !== null)
      const price = await page.innerText('[itemprop="price"]', 'query')
      console.log(price)
      console.log(stock)
      const date = new Date().toISOString()
      const query = { store: "Walmart", storeID: config["upc"].split('/')[1] };
      Stock.count(query, function (err, count){
        if(count == 0){
          Stock.create({store: "Walmart", storeID: config["upc"].split('/')[1], isInStock: stock, lastUpdated: date, pricePer: price.replace('$',''), purchaseLink: "https://www.walmart.com/ip/" + config["upc"]})
        }
        else{
          Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price.replace('$',''), purchaseLink: "https://www.walmart.com/ip/" + config["upc"]}, {upsert: false}, function(err, doc) {});
        }
      })
      await browser.close();
      const embed = new MessageBuilder()
      .setTitle('COVID Test Stock Update')
      .setDescription('Stock on item :' + config["brand"] + " is " + stock)
      .setColor('#00b0f4')
      .setTimestamp();
      hook.send(embed);
      hook.sendFile('./' + config["upc"].split('/')[1] + '.png');
    }
    else{
      for (var i = 0; i < config.length; i++) {
        const browserType = playwright.webkit
        const browser = await browserType.launch({headless:false});
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("https://www.walmart.com/ip/" + config[i]["upc"]);
        await page.screenshot({ path: './' + config[i]["upc"].split('/')[1] + ".png" });
        const stock = await page.$("text='Add to cart'") !== null && (await page.$("text='Shipping, '") !== null || await page.$("text='Free shipping, '") !== null)
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
        hook.sendFile('./' + config[i]["upc"].split('/')[1] + '.png');
        await timer(70000)
      }
  
    }
}
const cron = require('node-cron');

cron.schedule(process.env.cron, () => {
  walmart()
})