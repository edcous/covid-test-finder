const fs = require('fs')
const timer = ms => new Promise(res => setTimeout(res, ms))
const { default: axios } = require('axios');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/925613913943441501/GoVJihRyctQ2UiuZ90gwKFXHmeN5Y5h-R0s1rJfPPkqlQeXL2wWYIHe5exi8CRtBKl2n");
const config = JSON.parse(fs.readFileSync('./optum/tests.json', 'utf8'))
console.log(config);
var wm_results = [];
var minutes = 10, the_interval = minutes * 60 * 1000;

(async () => {
    for (var i = 0; i < config.length; i++) {
        const raw_res = await axios.get("https://api.store.optum.com/search/product?sku=" + config[i].upc);
        const parsed = raw_res.data
        console.log(parsed.products[0].label)
        console.log(parsed.products[0].isPurchasable)
    }
})();
