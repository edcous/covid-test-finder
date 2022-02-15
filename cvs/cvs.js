const { default: axios } = require('axios');
const playwright = require('playwright');
const fs = require('fs')
const Stock = require('../models/stock.js')
const connection = require('../config/db.config.js');
const config = JSON.parse(fs.readFileSync('./cvs/tests.json', 'utf8'))
var minutes = 60, the_interval = minutes * 60 * 1000;
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
const cookie = 'acct_pe=p1; pe=p1; dfl=on; imp=on; acct_gac=on; acct_pymt=off; acctdel_v1=on; accnt_ph2=on; adh_new_ps=on; adh_ps_pickup=on; adh_ps_refill=on; bab_atb=off1; bab_cc=on; buynow=off; sab_displayads=on; dashboard_v1=on; db-show-allrx=on; disable-app-dynamics=on; dpp_cdc=off; dpp_drug_dir=off; dpp_sft=off; getcust_elastic=on; enable_imz=on; enable_imz_cvd=on; enable_imz_notimeslot_cache=on; enable_imz_reschedule_instore=on; enable_imz_reschedule_instore_noncovid=on; enable_imz_reschedule_multiplendc=off; enable_imz_reschedule_clinic=on; enable_imz_reschedule_clinic_noncovid=on; enable_imz_reschedule_clinic_dose2=off; footer_new_V1=on; gbi_cvs_coupons=true; gbp_api_v2=on; ice-phr-offer=off; v3redirecton=false; mc_cloud_service=on; mc_hl7=on; mc_ui_ssr=off-p0; mc_videovisit=on; mcsrv=off; newauthflow=on; pauth_v1=off; pivotal_forgot_password=off-p0; pivotal_sso=off-p0; ps=on; rxdanshownba=off; rxdfixie=on; rxd_bnr=on; rxd_dot_bnr=on; rxdpromo=on; rxduan=on; rxlitelob=off; rxm=on; rxm_ph_dob=on; rxm_demo_hide_LN=off; rxm_rx_challenge=off; rxmsecques=on; s2c_beautyclub=on; s2c_cmxadc=on; s2c_dmenrollment=on; s2c_newcard=off-p0; s2c_rewardstrackerbctile=on; s2c_rewardstrackerbctenpercent=on; s2c_rewardstrackerdob=off; s2c_rewardstrackerqebtile=off; s2c_s2chero=on; s2c_securecard=off-p0; s2c_smsenrollment_aop=on; s2c_dmenrollment_aop=on; s2c_smsenrollment_eh=off; s2c_transactionsrd=on; sft_mfr_new=on; sftg=on; show_exception_status=on; sl_v2=on; v2-dash-redirection=on; mt.v=2.1029896018.1642219789815; BVImplall_route=3006_3_0; gbi_visitorId=ckyfb9hc500013f6j1inqi8sq; _group1=quantum; _group6=quantum; nlbi_2490223=cj7CYxQti3Ebx/PLlv24IAAAAADUvsGPvOZoAZvimXHWjM/6; visid_incap_2490223=IcmYMe5KSaGHBM9nn86BIhJJ4mEAAAAAQUIPAAAAAADGg+6W8YOiZW6drAeaar9P; favorite_store=2111/39.0241/-77.4805/Ashburn/VA; bab_bopis_msp=off; BVBRANDID=fe70e58a-da05-46ef-90d4-08455470f415; __gads=ID=8b8fdbdc02491c25:T=1642219812:S=ALNI_MZLPtNA2ytFa6U8d5NKkkBwImC5lQ; AMCVS_06660D1556E030D17F000101%40AdobeOrg=1; s_cc=true; _4c_=%7B%22_4c_mc_%22%3A%224ea7b1ce-5f1d-464e-883d-700692bb5801%22%7D; QuantumMetricUserID=16d292bb0b65bb8540411fd8ad03350b; s_fid=6C9585384667FC52-2C14251C6903632F; DYN_SC=550147#1-hg%; JSESSIONID=xplzJIhIbG6vhYCBjF2vfudnjO3BdiUsDHXbKpY2.commerce_1206; aat1=on; bm_sz=C9EECBFD4DAF88631BBA3D12F5D019E5~YAAQWKTAF28iWKF+AQAAZyKprQ4YA+HIzhqU7f3IS928WwkbFBlKV+TI2DZ89tP2Mpr8BzQXz0Ruix/torbByWhXWlGTCOc47ab0orm1GpefetgnHyWw6nbe6egmutmAQG8iRVDNF9FJYkHuh43W0WCyRDj/IEnLfnI1qmc48mExuSyrzlxXYTer4XXzipwMoGmgGAHZKoInKHDsfNscDsFJ/7MP624mCB5VO5wqTq88HTpXRQiRXXTncPzc4qkHui4n9Y62qZCukL6rP7yAkyQ7mBqBx5+jF0PnEC7OsQY=~3425094~3224627; ak_bmsc=CA0AD608F1ABE2C6BD85A9661B36374B~000000000000000000000000000000~YAAQWKTAF24iWKF+AQAAZyKprQ46fssXH+rc+g2gnt2GPrbIfZqURdH4w2/npa2AcRdcYPWaAateZv0cU/4CiVe6KEZKKfODRmOhro7K1H4FQ1q+lIUIOj4/AD8DkP6Nx1Sok+r6S/uhGJ/x5wc8Wbk4k5xTsm4HuJ/56towC8IxvFftQN6j2i4sfgYv2zqjeSo4YaHyPY0ExFapVTlYxZ67H0DnN/Zo8+UxzB2BjEs0LN25btYsngfIXrMa9yVDkEW+tjZ7Gwg3g9l6nz2kHTx4n5LjIkgC74eu1PBIWqnEyxor5brLzDj9GDXAtkTXiRiou18yuUF7sG+u1NLcH8Fop9yO4BxGa5pkgXVKC/vDdBn+xKwcisAmb33Jf2lm7HW+Z9pi1ms=; acct_v1=off; acct_gp=off; _group7=quantum; _group8=none; nlbi_2490223_2484222=o/C3HAJh/Dli4QbtPyV0xQAAAABoTpFL0Q1d7BsNMn4uIez7; incap_ses_1422_2490223=nEKbNfW5GWPam5bZrPW7E4s192EAAAAANRiNKfm2a9pRp0H3DNQkEA==; nlbi_2490223_2556239=Lz2lc4LfxgO+umNSPyV0xQAAAAA7XHoGK4pdmV5YMRYs2llO; _gcl_au=1.1.832156109.1643591052; _fbp=fb.1.1643591052646.143565024; QuantumMetricSessionID=2f866c41d40fa9a445383bc9fac4de30; QuantumMetricSessionLink=https://cvs.quantummetric.com/#/users/search?autoreplay=true&qmsessioncookie=2f866c41d40fa9a445383bc9fac4de30&ts=1643547853-1643634253; current_page_name=cvs|dweb|content|coronavirus|PROMO: Coronavirus Resource Center: Testing and Vaccine Updates | CVS Pharmacy; previous_page_name=undefined; previous_page_url=https://www.cvs.com/content/coronavirus?icid=search-COVID-Testing; nlbi_2490223_2354344=PFxsPxm+4wevXGSUPyV0xQAAAAAb3SKLtAHfA/hi0dGVct6b; CVPF=CT-USR; gbi_sessionId=ckz1zom4e00003f6rn6eeiknz; nlbi_2490223_2556230=9nRuJccMb11gEsDtPyV0xQAAAADhmsg8HlLPxfPvUYxrSWIB; BVBRANDSID=f8bf653a-d4ff-4ac2-bc92-7e73d22e1790; akavpau_vp_www_cvs_com_shop=1643591489~id=179c59454fea53574e1cfe31ca2e9b33; AMCV_06660D1556E030D17F000101%40AdobeOrg=1994364360%7CMCIDTS%7C19024%7CMCMID%7C45517848547748999684257518974254899491%7CMCAAMLH-1644195869%7C9%7CMCAAMB-1644195869%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1643598269s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C3.4.0; s_sq=cvshealthcvssandbox%3D%2526c.%2526a.%2526activitymap.%2526page%253Dhttps%25253A%25252F%25252Fwww.cvs.com%25252Fshop%25252Fabbott-binaxnow-covid-19-antigen-self-test-2-tests-for-serial-testing-prodid-550147%2526link%253DCheck%252520nearby%252520stores%2526region%253Droot%2526.activitymap%2526.a%2526.c; br_breadcrumb=undefined; category_id=undefined; incap_ses_1441_2490223=Dy93Cp1QjHLJTy3AEHb/E54192EAAAAAmdU60jUc96nCFLXGG1tg+Q==; mt.cem=211211-COVID-at-Home - 211211, experiment | 211205-Add-Alternative-product - 211205-Add-Alternative-product,experiment | 211105-CVScom-HP-Add - 211105-CVS-HP-CareWidget,test | 220117-CVS-COVID-Test_1548535 - 220117-CVS-HP-insbanner,experimentA | 220113-FS-PDP-At_1551821 - A-Control-hides-all-module; reese84=3:uaTlWPG9xcj3htB+tgAANw==:OLQeQkQDhbdJRZVKEGovnPP1R2ZHFUsokUtHWxWKOq8HI4UfJK8F4geb6zVsWd5p5WHP9Ed9mAiW0DSgMtxIZWsKlFoGzQGp1P/t47s7s1OD9ywNDOVAGCDpDRn1kmEqvqzFACqjgTRNm/Ij4EQp7X92pxoUEDyNA/YTF1bpHQGfD1bSN+IyTgBcrazmtzhg1yT2RuGpdAT3YtZdynp5GbhathNpIoXR30ijT4/TfO3nYE2Ol22o5KJgzX9ARyIL0ry/hcrCI2o6Tgrk5kUjLojpeLXjhL/JgvzAsjFFi60F5RR4O5Z5zmP2ZnN67qCmJnrKxpWQxJEPqaPbsv2Uj6MPK20mDpqD5xFiZspJMPUrwcFnsL3AXTi1VRvqF9Sq6rEd0dS/vKSW+oIDXvYnwB/uRgLVMe1UdGQB8JkXOmm19JzKZTJavCPyz0t7UXBs:bQ1s8nQ380Jo54qPkH68CQG08c/Y7e7ZCydpRAFtCss=; cto_bundle=SG0HvV9YMnRWR1ZKJTJCU3dXNVRXMFFoNWNteElaMEMlMkJ0OHBYUSUyRmhJRHE4dkVLSTRhdXhuRWpEVmp0V2tFREI0bGVKUjlJbmUzbTdXYVFramliQm9STGpLMm0wYktCbFZSUUI4YXBTOXlGblNCZUNFSUwlMkZrbiUyQlJ4Y0pmdGQ0UThrVmhSemp1NElTdUlhN1N2N3ZzYVBTN3RVVVhyY29weGllQ3E2UFJoanBUUnZ1JTJGZWJnMVc0a1Z2bGYlMkJ4YW9aaWc3SmhoOQ; mt.mbsh=%7B%22fs%22%3A1643591051965%2C%22sf%22%3A1%2C%22lf%22%3A1643591072862%7D; gpv_e5=cvs%7Cdweb%7Cshop%7Cflowflex-covid-19-antigen-home-test-prodid-823994%7Cflowflex%20covid-19%20antigen%20home%20test%28823994%29; gpv_p10=www.cvs.com%2Fshop%2Fflowflex-covid-19-antigen-home-test-prodid-823994; _br_uid_2=uid%3D8725941055865%3Av%3D15.0%3Ats%3D1642219820067%3Ahc%3D12; akavpau_vp_www_cvs_com_shop_covid=1643591494~id=7e5f8210098717e292832f683871a3dc; akavpau_www_cvs_com_general=1643591495~id=883c23390656e6ad1c84a22ad452016a; utag_main=v_id:017e5bed6761002156ce94b1a56005079006c07100942$_sn:3$_se:5$_ss:0$_st:1643592875098$vapi_domain:cvs.com$_pn:4%3Bexp-session$ses_id:1643591050600%3Bexp-session; RT="z=1&dm=cvs.com&si=8a91a436-a065-4f54-805a-2a422b7a7c1a&ss=kz1zoa7z&sl=4&tt=6v1&bcn=%2F%2F17de4c1c.akstat.io%2F&obo=1"; nlbi_2490223_2147483646=kljxasI6ijxlIGlLPyV0xQAAAACaSCeO6K7SKxxq2/e99AiZ; _abck=92882A555E24AC456685BA2E18B75FD9~0~YAAQWKTAF3MpWKF+AQAAyYaprQf/IyFtI6NqkEScGThvKIAD333IkNMHZY2d/Ft0SDzgBwCj3NnsX4NXuog5MPrqwacsIKG85IQUpnGfujjChdrHrlt7HKOMBihuzo8XUoWj1PkaH5boe1vLdhSx6raWo9eJ8nyK+v86Sd5obFunHAHZEoIxyE751H3OdhlLXy1eA7z471rf6B8w9C5zdsrg5MNA7YJq504ydHBBIGYoZ8SId4mxhs5EXbLHgQJ1NoAWdTs+lhqhASz8t53ntAbrsr/+TMeeIvn7g3CQum3bT/XtVRkGcMOdmvUovS/28eB2PYp6DfxKVIcnH/iaj+jF3CbovvcwbtdJRZWL1AfcCgSqKOBeXjCYNp1C9EzHudpBh1jhC8BTriw1LEF9hNANa4lk~-1~||1-FluWKyyNKp-1-10-1000-2||~-1; mp_cvs_mixpanel=%7B%22distinct_id%22%3A%20%2217e5bed8513991-077c754002b31e-36657707-13c680-17e5bed85149ba%22%2C%22bc_persist_updated%22%3A%201642219799842%2C%22carepass_patched_false%22%3A%20true%7D; bm_sv=C1812851BB1F6895557FC1F5B578C69A~tdnkN5oc96pYYu5gJi+tI6/4iWVSLa1y8dbx8o0FRjrJfrds4yKdCBsATIxKMlmX5OkjgQQmXVbEzi2UpGHR5BOU0Fx8z8yg3tqSjtO/JNq+yL/96hjOv9+xlz+fdct1ZmbFmF0U5IsgoSWtd4Z2ZA=='
async function cvs(){
        for (var i = 0; i < config.length; i++) {
            const sku = config[i]["sku"]
            const date = new Date().toISOString()
            console.log(sku)
            const browserType = playwright.webkit
            const browser = await browserType.launch({});
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto("https://www.cvs.com/shop/" + config[i]["url"]);
            await timer(3000);
            const price = await page.innerText('[class="css-901oao r-1khnkhu r-1jn44m2 r-3i2nvb r-vw2c0b r-1b7u577"]', 'query')
            const stock = await page.$("text='Eligible for 1-4 day shipping'") !== null
            const query = { store: "CVS", storeID: sku }
            await page.screenshot({ path: './' + 'c-f-c' + ".png" });
            await browser.close();
            Stock.count(query, function (err, count){
                if(count == 0){
                    Stock.create({store: "CVS", storeID: sku, isInStock: stock})
                }
                else{
                    Stock.findOneAndUpdate(query, {isInStock: stock, lastUpdated: date}, {upsert: false}, function(err, doc) {});
                }
              })
              const embed = new MessageBuilder()
              .setTitle('COVID Test Stock Update')
              .setDescription('Stock on item :' + config[i]["brand"] + " is " + stock)
              .setColor('#00b0f4')
              .setTimestamp();
              hook.sendFile('./' + 'c-f-c' + ".png")          
              hook.send(embed);
              await timer(process.env.minutes)
        }
}

setInterval(function() {
    cvs()
}, the_interval);

cvs()