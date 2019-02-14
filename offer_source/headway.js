const rp = require('request-promise-native');
const nlog = require('../model/nlog.js');
const req = require('request');
const loadCarrier = require('../model/loadcarrier');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('headway');
        let maxpage = 1;
        let offers=[];
        let p_offers=[];
        for(let j=1;j <= maxpage;j++){
            p_offers.push(getPage(j)) ;

        }
        let new_offers = await Promise.all(p_offers);
        for(let k in new_offers){
            offers.push.apply(offers, new_offers[k]);
        }
        ac(offers);
    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];

        try {
            let op = {
                method: 'POST',
                uri: 'https://api.mobra.in/v1/auth/login',
                formData: {
                    'user': 'fanny@leanmobi.com',
                    'password': '123456',
                }
            }
            let cookie = await new Promise(function(a,j){
                req(op,function(err,res,body){
                    a(res.headers['set-cookie'])
                })
            })

            let cookie_1 = rp.cookie('' + cookie[0]);
            let cookiejar = rp.jar();
            //console.log(cookie_1);return
            cookiejar.setCookie(cookie_1, 'http://api.mobra.in/v1/campaign/feed?skip=0&limit=500');
            let option = {
                url: 'http://api.mobra.in/v1/campaign/feed?skip=0&limit=500',
                method: 'GET',
                jar: cookiejar
            };
            let data = await rp(option);
            data = JSON.parse(data);

            let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=headway');
            offer_ids = JSON.parse(offer_ids);
            let offer_id_arr = [];

            if (offer_ids.offer_id.length > 0) {
                offer_ids = offer_ids.offer_id.split(',');
                for (let i in offer_ids)  {
                    offer_id_arr.push(String(offer_ids[i]));
                }
            }
            for (let i in data.data) {
                let tmpOffer = {};
                let adv_offer = data.data[i];

                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }

                if (offer_id_arr.length > 0) {
                    if (offer_id_arr.indexOf(adv_offer.offer_id) == -1) {
                        continue;
                    }
                }
                //console.log(data);return
                tmpOffer.offer_name = adv_offer.name;
                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.daily_cap = 0;
                tmpOffer.kpi = adv_offer.restrictions;
                tmpOffer.des = adv_offer.restrictions;
                tmpOffer.platform = 'web';
                tmpOffer.adv_url = adv_offer.click_url + "sid={clickid}&p={network_id}_{sub_id}";
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.countries;
                let carrier=adv_offer.carriers;
                tmpOffer.carrier = loadCarrier.search(tmpOffer.geo,carrier);

                tmpOffer.flow = adv_offer.flow_type;
                tmpOffer.preview = adv_offer.app_id;

                tmpOffer.survey_level = 1;
                tmpOffer.manually = 1;//停用探测,非空都不探测
                tmpOffer.survey_status = true;

                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            console.log('error'+page);
            console.log(e);
            nlog.error(e);
            ac([]);
        }
    });

}