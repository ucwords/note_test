const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('crowmobi');
        let maxpage = 5;
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
            let data = await rp('http://api.crowmobi.com/v2/affiliate/offer/findAll?token=D7OxgTTd0cNA3C2g1aSdgEaPaBYyI4XP&page='+page);
            //console.log(data);
            data = JSON.parse(data);
            
            if ((!data.success) || data.offers.length == 0) {
                ac([]);
            }
 
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];
                if ((adv_offer.Type != 'Non incent')||(adv_offer.Currency != 'USD') || (adv_offer.Status != 'active')){
                    continue;
                }
              
                tmpOffer.adv_offer_id = adv_offer.ID;
                tmpOffer.package_name = adv_offer.APP_ID;
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                    tmpOffer.platform = 'ios';
                }
                if(!adv_offer.Goals[0]){
                    continue;
                }
                if(adv_offer.Goals[0].Name != 'Install'){
                    continue;
                }
                tmpOffer.payout = adv_offer.Goals[0].Payout;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.Goals[0].Daily_cap;
                if (!adv_offer.Tracking_url){
                    continue;
                }
                tmpOffer.adv_url = adv_offer.Tracking_url +'&aff_sub={clickid}&pubid={networkid}&aff_sub2={gaid}&idfa={idfa}';
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.Goals[0].Countries.split(',');
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            nlog.error(e);
            ac([]);
        }
    });
    
}