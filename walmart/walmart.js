const playwright = require('playwright');
const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925840818684723260/U-32YKxWInEbxksGxVvfwFTV2drL7JDfuBEkDd3WKtMB0PiZehIengi0bcon3Wsu9QcJ");
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error with DB'))

const config = JSON.parse(fs.readFileSync('./walmart/tests.json', 'utf8'))
console.log(config);
var wm_results = [];
(async () => {
      for (var i = 0; i < config.length; i++) {
        const browserType = playwright.webkit
        const browser = await browserType.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("https://search.mobile.walmart.com/v1/products-by-code/UPC/" + config[i]["upc"]);
        await page.screenshot({ path: config[i]["upc"] + ".png" });
        const c = await page.content()
        const d = JSON.parse(c.replace("</pre></body></html>", "").replace('<html><head></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">', ""))
        wm_results[i] = {"upc": config[i]["upc"], "stock": d.data.online.inventory.available}
        Stock.count({store: "Walmart", storeID: config[i]["upc"]}, function (err, count){
          if(count == 0){
            Stock.create({store: "Walmart", storeID: config[i]["upc"], isInStock: d.data.online.inventory.available})
          }
          else{
            Stock.findOneAndUpdate({store: "Walmart", storeID: config[i]["upc"]}, {isInStock: d.data.online.inventory.available})
          }
        })
        await browser.close();
        const embed = new MessageBuilder()
        .setTitle('COVID Test Stock Update')
        .setDescription('Stock on item :' + d.data.common.name + " is " + d.data.online.inventory.available)
        .setColor('#00b0f4')
        .setTimestamp();
        hook.send(embed);
        await timer(5000);
      }
      console.log(wm_results)
})();
var minutes = 10, the_interval = minutes * 60 * 1000;
setInterval(function() {
  console.log("I am doing my 5 minutes check");
  (async () => {
    for (var i = 0; i < config.length; i++) {
      const browserType = playwright.webkit
      const browser = await browserType.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("https://search.mobile.walmart.com/v1/products-by-code/UPC/" + config[i]["upc"]);
      await page.screenshot({ path: config[i]["upc"] + ".png" });
      const c = await page.content()
      const d = JSON.parse(c.replace("</pre></body></html>", "").replace('<html><head></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">', ""))
      wm_results[i] = {"upc": config[i]["upc"], "stock": d.data.online.inventory.available}
      await Stock.findOneAndUpdate({store: "Walmart", storeID: config[i]["upc"]}, {isInStock: d.data.online.inventory.available})
      await browser.close();
      const embed = new MessageBuilder()
      .setTitle('COVID Test Stock Update')
      .setDescription('Stock on item :' + d.data.common.name + " is " + d.data.online.inventory.available)
      .setColor('#00b0f4')
      .setTimestamp();
      hook.send(embed);
      await timer(5000);
    }
    console.log(wm_results)
  })();
}, the_interval);
