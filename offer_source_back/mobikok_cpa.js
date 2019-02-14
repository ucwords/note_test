const rp = require('request-promise-native');
const nlog = require('../model/nlog.js');
const loadcarrier = require('../model/loadcarrier');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('mobikok_cpa');
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
            let data = await rp('http://ssp.mobikok.com/inter/apps!get.action?s=3fecb17b-a625-4e9c-b834-6db78ae0fc97');
            data = JSON.parse(data);
            if (data.status != 'success') {
                ac([]);
            }
            if (data.offers.length == 0) {
                ac([]);
            }

            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];
                if(adv_offer.currency != 'USD'){
                	continue;
                }
                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {                  
                    continue;
                }
                tmpOffer.geo=[];
                tmpOffer.carrier=[];
                let area = adv_offer.area;
                if ((!area )|| (area.length == 0)){
                    continue;
                }
                for(let t in area){
                    tmpOffer.geo.push(area[t].country);
                    tmpOffer.carrier.push.apply(tmpOffer.carrier,
                    	loadcarrier.search([area[t].country],area[t].carriers)
                    );
                }
                tmpOffer.offer_name = adv_offer.name;
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.daily_cap = adv_offer.caps;
               // tmpOffer.kpi = adv_offer.kpi;
                tmpOffer.des = adv_offer.description;
                tmpOffer.platform = 'web';                
                tmpOffer.adv_url = adv_offer.trackingUrl.replace('s1={s1}&s2={s2}&s3={s3}&s4={s4}&s5={s5}', 's1={clickid}&s2={networkid}&s3={sub_channel}');
                tmpOffer.flow = adv_offer.conversion;
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