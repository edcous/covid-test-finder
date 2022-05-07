const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/926968148467548202/l22mkOLaNjpoh2VluLbCE9pfNmZEI9JwBPI0aU8ll_f48W8HeCxbv0scWA7BV28Oafg7");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('roman')){
    process.exit()
}

async function ro() {
    const browserType = playwright.webkit
    const browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.getroman.com/on-go-covid-19-antigen-self-test/");
    await timer(3000);
    const stock = await page.$("text='Availability: In stock'") !== null
    console.log(stock)
    const date = new Date().toISOString()
    const query = { store: "Ro", storeID: 'on/go'};
    Stock.count(query, function (err, count){
      if(count == 0){
        Stock.create({store: "Ro", storeID: 'on/go', isInStock: stock, lastUpdated: date})
      }
      else{
        Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
      }
    })
    await browser.close();
    const embed = new MessageBuilder()
    .setTitle('COVID Test Stock Update')
    .setDescription('Stock on item :' + 'on/go' + " is " + stock)
    .setColor('#00b0f4')
    .setTimestamp();
    hook.send(embed);
}

const cron = require('node-cron');

cron.schedule(process.env.cron, () => {
  ro()
})