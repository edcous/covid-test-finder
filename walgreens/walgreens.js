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
    const s1 = await page.$("text='Out of stock'") == null
    const price1 = await page.innerText('[class="product__price"] >> span >> nth=0', 'query')
    const price2 = await page.innerText('[class="product__price"] >> sup >> nth=1', 'query')
    const parsedPrice = parseFloat(price1 + '.' + price2)
    var s2 = false;
    if(s1){
      if(await page.$('[class="product-ship"]') == null){
        await page.click('[id="wag-shipping-tab"]')
      }
      await page.click('[aria-label="Add to cart for shipping. Opens simulated dialog."]')
      await timer(2000)
      s2 = await page.$("text='View cart'") !== null
    }
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Walgreens", storeID: config[i]["id"], isInStock: s2, lastUpdated: date, pricePer: parsedPrice, purchaseLink: "https://www.walgreens.com/store/c/" + config[i]["url"] })
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: s2, lastUpdated: date, pricePer: parsedPrice, purchaseLink: "https://www.walgreens.com/store/c/" + config[i]["url"]}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + config[i]["url"] + " is " + s2)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    await timer(10000);
  }
}

var minutes = 5, the_interval = minutes * 60 * 1000;
setInterval(function() {
  walgreens()
}, the_interval);