const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/927396550638968872/Az52V0WnrOK2CutUu4v-arSEZgb2xnxWUxT82hveuYtpkEzdNZ-Jp3wcw6NqjuiPCGQm");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('costco')){
    process.exit()
}

async function costco() {
    const browserType = playwright.webkit
    const browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.costco.com/flowflex-at-home-covid-test-kit,-5-test-pack.product.100825502.html");
    await timer(3000);
    const stock = await page.$("text='Add to Cart'") !== null
    console.log(stock)
    const date = new Date().toISOString()
    const query = { store: "Costco", storeID: '100825502'};
    await page.screenshot({ path: './' + 'c-f-c' + ".png" });
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Costco", storeID: '100825502', isInStock: stock, lastUpdated: date})
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + 'flowflex' + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
    hook.sendFile('./' + 'c-f-c' + ".png")
}
const cron = require('node-cron');

cron.schedule(process.env.cron, () => {
  costco()
})