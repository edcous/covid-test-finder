const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/926137818764431400/TbFmX1eZNsBwRe-Xuc5QLiF-zd4XuYDMuMOW112pdENFu4bCp0hDM0JJQvD_TSNtp0MC");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

const config = JSON.parse(fs.readFileSync('./walgreens/tests.json', 'utf8'))
console.log(config);
require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('walgreens')){
    process.exit()
}

async function walgreens(){
  for (var i = 0; i < config.length; i++) {
    const browserType = playwright.webkit
    const browser = await browserType.launch({});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.walgreens.com/store/c/" + config[i]["url"]);
    await page.screenshot({ path: config[i]["url"] + ".png" });
    const date = new Date().toISOString()
    const query = { store: "Walgreens", storeID: config[i]["id"] };
    const stock = await page.$("text='Out of stock'") == null
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Walgreens", storeID: config[i]["id"], isInStock: stock, lastUpdated: date, purchaseLink: "https://www.walgreens.com/store/c/" + config[i]["url"] })
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, purchaseLink: "https://www.walgreens.com/store/c/" + config[i]["url"]}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + config[i]["url"] + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    await timer(5000);
  }
}

var minutes = 5, the_interval = minutes * 60 * 1000;
setInterval(function() {
  walgreens()
}, the_interval);
