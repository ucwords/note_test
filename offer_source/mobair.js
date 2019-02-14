const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer=function(){
    console.log('mobair');
    return new Promise(async function(ac,rj){
        let off = await Promise.all([getOffer('IOS'),getOffer('Android')]);
        let offers = off[0];
        offers.push.apply(offers, off[1]);
        //console.log(offers);
        ac(offers);
    });
}

function getOffer(pl) {
    return new Promise(async (ac, rj) => {
        let offers = []
       
        try {
            let data = await rp('http://apptrknow.com/api/v1?api_key=gews2vdJ2KyCPo8iuCGhMyq2YbjAteAN&pub_id=8483&c=10154&incent=1&os='+pl+'&country=ALL&campaign_limit=1000');
            //console.log(data);
            data = JSON.parse(data);
            if (data.status != 'OK') {
               return ac([]);
            }
            if (data.ads.length == 0) {
                return ac([]);
            }

            for (let i in data.ads) {
                let tmpOffer = {};
                let adv_offer = data.ads[i];

                if(adv_offer.payout_type != 'cpi'){
                    continue;
                }

                tmpOffer.payout = adv_offer.payout + '';
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.offerid+'';
                tmpOffer.package_name = adv_offer.appid;
                tmpOffer.offer_name = adv_offer.title;
                if (!tmpOffer.package_name) {
                    continue; 
                }
                tmpOffer.daily_cap = 0;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                let click_info=adv_offer.clickurl.split('cid=[cid]');
                tmpOffer.adv_url = click_info[0] + 'cid={clickid}&affsub1={network_id}-{sub_id}&idfa={idfa}&gaid={gaid}&creative_id={sub_id}';
                tmpOffer.kpi = adv_offer.restrictions;
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.countries.split(',');
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {

            rj(e);
        }

    });
}




