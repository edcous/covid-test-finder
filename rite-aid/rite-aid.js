const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/930552560257998889/XtyP1eiNksCH4uyQeVmIYRH2HFtfPessthiQnyN4NEdRt_WDaTFXBDJRZP_QCdvOOjWf");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

const config = JSON.parse(fs.readFileSync('./rite-aid/tests.json', 'utf8'))
require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('riteaid')){
    process.exit()
}

async function ra() {
  for (var i = 0; i < config.length; i++) {
    const browserType = playwright.webkit
    const browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.riteaid.com/shop/" + config[i]["upc"]);
    await timer(10000);
    await page.screenshot({ path: './' + config[i]["upc"] + ".png" });
    const stock = await page.$("text='In stock'") !== null
    var price;
    if(stock){
        price = await page.innerText('[class="price"]', 'query')    
    }
    console.log(stock)
    const date = new Date().toISOString()
    const query = { store: "RiteAid", storeID: config[i]["upc"] };
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "RiteAid", storeID: config[i]["upc"], isInStock: stock, lastUpdated: date, purchaseLink: "https://www.riteaid.com/shop/" + config[i]["upc"]})
      }
      else{
          if(stock){
            Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price.replace('$','')}, {upsert: false}, function(err, doc) {});
          }
          else{
            Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
          }
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    hook.sendFile('./' + config[i]["upc"] + ".png")
    await timer(10000);
  }
}

var minutes = 120, the_interval = minutes * 60 * 1000;

setInterval(function() {
  ra()
}, the_interval);