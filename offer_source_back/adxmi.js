const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('adxmi');
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
            let data = await rp('http://api-offers.miadx.net/aff/offers/list/approval?key=cbed50009f5e5b4475244f5c6a3ae0dc&limit=100&page=' + page +'&onlyApproved=1&filter[traffic_type]=Non-Incentive&filter[payout_type]=CPI');
            data = JSON.parse(data);
            if (data.c!='0'||(!data.d)) {
                ac([]);
            }
            if (data.d.offers.length == 0) {
                ac([]);
            }
            for (let i in data.d.offers) {
                let tmpOffer = {};
                let adv_offer = data.d.offers[i];
                if (adv_offer.offer_status != 'active') {
                    console.log(adv_offer.offer_status);
                    continue;
                }
                tmpOffer.payout = adv_offer.offer_payout;
                if (tmpOffer.payout < 0.08) {                  
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.package_name = adv_offer.itunes_id || adv_offer.package_name;
                tmpOffer.daily_cap=adv_offer.daily_cap;
                tmpOffer.kpi = adv_offer.kpi;
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.tracking_link + '&aff_sub={clickid}&source={pub_id}&google_aid={gaid}&ios_ifa={idfa}';
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.country;
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            console.log('error'+page);
            nlog.error(e);
            ac([]);
        }
    });
    
}