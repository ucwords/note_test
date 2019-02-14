const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('micmobi');
        try {
            let data = await rp('http://api.micmobi.com/api/offer/lists?sid=115&api_token=mkdJHtXr6xJSaGy1');
            //console.log(data);
            data = JSON.parse(data);
            if (data.message != 'ok') {
               return ac([]);
            }
            if (data.ads.length == 0) {
                return ac([]);
            }
            for (let i in data.ads) {
                let tmpOffer = {};
                let adv_offer = data.ads[i];

                tmpOffer.payout = adv_offer.price;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                if (adv_offer.traffic_model != 'cpi'){
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.package_name = adv_offer.pkgName;
                
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.daily_caps;
                if(tmpOffer.daily_cap == -1){
                    tmpOffer.daily_cap=0;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                tmpOffer.adv_url = adv_offer.tracking_url + '&click_id={clickid}&sub_channel={networkid}&android_id={android}&idfa={idfa}&gaid={gaid}&imei=&aff_sub5='
                tmpOffer.kpi = adv_offer.kpi;
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

//test();