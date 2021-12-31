const { default: axios } = require('axios');
const playwright = require('playwright');
const fs = require('fs')
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
const config = JSON.parse(fs.readFileSync('./cvs/tests.json', 'utf8'))
var minutes = 5, the_interval = minutes * 60 * 1000;
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925840857209380885/Cm0_aNfJ_gnuzssYhHJs424NiB_7RqPzR5Cg3AaDfO6qYowAHHZoLUjIqAUQtzh16iOa");
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))
require('dotenv').config()
const stores = process.env.storesToRun.toString().toLowerCase();

if(!stores.includes('cvs')){
    process.exit()
}

async function cvs(){
        for (var i = 0; i < config.length; i++) {
            const sku = config[i]["sku"]
            const date = new Date().toISOString()
            console.log(sku)
            const res = await axios.post('https://www.cvs.com/RETAGPV3/OnlineShopService/V2/getSKUInventoryAndPrice', {"request":{"header":{"lineOfBusiness":"RETAIL","appName":"CVS_WEB","apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","channelName":"WEB","deviceToken":"d9708df38d23192e","deviceType":"DESKTOP","responseFormat":"JSON","securityType":"apiKey","source":"CVS_WEB","type":"retleg"}},"skuId":[config[i]["sku"]],"pageName":"PLP"})
            const stock = res.data.response.getSKUInventoryAndPrice.skuInfo[0].stockLevel != 0
            const browserType = playwright.webkit
            const browser = await browserType.launch({});
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto("https://www.cvs.com/shop/" + config[i]["url"]);
            await timer(3000);
            const price = await page.innerText('[class="css-901oao r-1khnkhu r-1jn44m2 r-3i2nvb r-vw2c0b r-1b7u577"]', 'query')
            const query = { store: "CVS", storeID: sku }
            await browser.close();
            Stock.count(query, function (err, count){
                if(count == 0){
                    Stock.create({store: "CVS", storeID: sku, isInStock: stock, pricePer: price.replace('$','')})
                }
                else{
                    Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date, pricePer: price.replace('$','')}, {upsert: false}, function(err, doc) {});
                }
              })
              const embed = new MessageBuilder()
              .setTitle('COVID Test Stock Update')
              .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
              .setColor('#00b0f4')
              .setTimestamp();
              hook.send(embed);      
              await timer(60000)
        }
}

setInterval(function() {
    cvs()
}, the_interval);