const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('funny');
        let maxpage = 4;
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
            let data = await rp('http://u.z2z.org/getApp?affid=168260&apikey=f4ae69a2-cd21-4f8c-9eb3-8a91f7433a08&page='+page+'&size=1000');
            //console.log(data);
            data = JSON.parse(data);
            
            if (!data.result) {
                
                ac([]);
            }
            if (data.data.length == 0) {
                
                ac([]);
            }
            for (let i in data.data) {
                let tmpOffer = {};
                let adv_offer = data.data[i];
                if ((adv_offer.currency != 'USD') || (adv_offer.payType != 'CPI') || (adv_offer.active != 'true')){
                    continue;
                }
                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.package_name = adv_offer.packageName;
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.trackingLink.replace('{affid}','{networkid}');
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.geo.split(',');
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            nlog.error(e);
            ac([]);
        }
    });
    
}