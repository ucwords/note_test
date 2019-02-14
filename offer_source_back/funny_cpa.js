const rp = require('request-promise-native');
const nlog = require('../model/nlog.js');
const loadCarrier = require('../model/loadcarrier');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('funny_cpa');
        let maxpage = 3;
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
            let data = await rp('http://api.z2z.xyz/pull?dev=2587&key=b1221492351b40d78c0fefc9374fcfd0&page='+page+'&size=1000');
            data = JSON.parse(data);
            if (!data.result) {
                ac([]);
            }
            if (data.offers.length == 0) {
                ac([]);
            }
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];
                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {                  
                    continue;
                }
                tmpOffer.offer_name = adv_offer.name;
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.daily_cap = adv_offer.dailyCap;
                tmpOffer.kpi = adv_offer.kpi;
                tmpOffer.des = adv_offer.description;
                tmpOffer.platform = 'web';                
                tmpOffer.adv_url = adv_offer.shortLink.replace('{pubid}', '{networkid}');
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.geos.split(',');
                let carrier=adv_offer.carrier.split(',');
                tmpOffer.carrier = loadCarrier.search(tmpOffer.geo,carrier);
                tmpOffer.flow = adv_offer.flow;
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