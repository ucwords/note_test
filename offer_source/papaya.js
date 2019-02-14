const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('papaya');
        let maxpage = 1;
        let offers=[];
         for(let j=1;j <= maxpage;j++){//papaya 他们说不支持并发
            let new_offers = await getPage(j) ;
             offers.push.apply(offers, new_offers);
        }
        /*let new_offers = await Promise.all(p_offers);
        for(let k in new_offers){
           
        }*/
        ac(offers);
    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
        try {
            let data = await rp('http://api.appflood.com/s2s_get_p_ads?token=363ab5e513d42d7d&page=' + page +'&pagesize=5000&incent=0&pricetype=cpi');
           // console.log('http://api.appflood.com/s2s_get_p_ads?token=363ab5e513d42d7d&page=' + page +'&pagesize=5000&incent=0&pricetype=cpi')
            data = JSON.parse(data);
            if (data.status!=='OK') { 
                ac([]);
            }
            if (data.offers.length == 0) {
                ac([]);
            }
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];
                if ((adv_offer.pricetype != 'cpi') ){
                    continue;
                }
                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.offerid;
                tmpOffer.package_name = adv_offer.package;
                tmpOffer.daily_cap=adv_offer.daily_cap;

                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.offer_url + '&aff_sub={clickid}&aff_sub3={android}{gaid}{idfa}&aff_sub6={network_id}-{sub_id}';
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.geo.split('|');
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            nlog.error(e);
            ac([]);
        }
    });
    
}