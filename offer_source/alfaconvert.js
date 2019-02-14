const rp = require('request-promise-native');
const nlog = require('../model/nlog.js');
const req = require('request');
const loadCarrier = require('../model/loadcarrier');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('alfaconvert');
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
                uri: 'https://api.afcvrt.com/api/accounts/api-token-auth/',
                formData: {
                    'email': 'fanny@leanmobi.com',
                    'password': 'test123AAA',
                }
            }
            let token = await new Promise(function(a,j){
                req(op,function(err,res,body){
                    a(body)
                })
            })

            token = JSON.parse(token);

            let option = {
                url: 'https://api.afcvrt.com/api/offers/offers/?format=json&limit=250',
                method: 'GET',
                headers: {
                    'Authorization': 'JWT '+ token.token
                }
            };

            let data = await rp(option);
            data = JSON.parse(data);

            let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=alfaconvert');
            offer_ids = JSON.parse(offer_ids);
            let offer_id_arr = [];

            if (offer_ids.offer_id.length > 0) {
                offer_ids = offer_ids.offer_id.split(',');
                for (let i in offer_ids)  {
                    offer_id_arr.push(parseInt(offer_ids[i]));
                }
            }

            for (let i in data.results) {
                let tmpOffer = {};
                let adv_offer = data.results[i];

                if (offer_id_arr.length > 0) {
                    if (offer_id_arr.indexOf(adv_offer.id) == -1) {
                        continue;
                    }
                }

                tmpOffer.payout = adv_offer.payoutForAffiliate;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }

                tmpOffer.offer_name = adv_offer.name;
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.daily_cap = adv_offer.dailyCap;

                tmpOffer.kpi = adv_offer.description;
                tmpOffer.des = adv_offer.description;

                tmpOffer.preview = adv_offer.preview_img;
                tmpOffer.platform = 'web';
                tmpOffer.adv_url = adv_offer.offer_url.replace('<your-click-id>', '{clickid}').replace('<your-source-id>', '{network_id}_{sub_id}');
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.mainCountry.split(',');

                let carrier = gerCarrier(adv_offer.offer_carriers);

                tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, carrier);
                tmpOffer.flow = adv_offer.flow;
                tmpOffer.tag = ['cpa'];
                tmpOffer.survey_level = 1;
                tmpOffer.manually = 1;//停用探测,非空都不探测
                tmpOffer.survey_status = true;

                tmpOffer.strict_geo = 1;

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

function gerCarrier(val)
{
    let carriers = [];
    for (let i in val) {
        carriers.push(val[i].name.toLowerCase());
    }

    return carriers;
}