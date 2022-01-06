const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/928689061944774769/KIjydL652Oe2oiPOiOSz8obJKVTMmEs1vQ9LaST8ELOMMGR3q4zcI1N8WJ_DKy7DQ0Zq");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('menards')){
    process.exit()
}

async function menards() {
    const browserType = playwright.webkit
    const browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.menards.com/main/grocery-home/health-beauty/personal-care/flowflex-trade-covid-19-antigen-rapid-home-test-kit-12-pack/sh00116a/p-5832605973320220.htm");
    await timer(3000);
    const stock = await page.$("text='ADD TO CART'") !== null
    const price = await page.$('[id="itemFinalPrice"]').innerText
    await page.screenshot({ path: './' + 'm-f-x' + ".png" });
    console.log(stock)
    const date = new Date().toISOString()
    const query = { store: "Menards", storeID: 'm-f-x'};
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Menards", storeID: 'm-f-x', isInStock: stock, lastUpdated: date, pricePer: price})
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + 'flowflex' + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    hook.sendFile('./' + 'm-f-x' + ".png");
}

var minutes = 5, the_interval = minutes * 60 * 1000;

setInterval(function() {
    menards()
}, the_interval);