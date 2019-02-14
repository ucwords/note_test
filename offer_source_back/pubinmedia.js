const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('pubinmedia');
        try {
            let data = await rp('http://api.pubinmedia.com/aff/offer/api?affid=10009&security=Yk2IJtL67bK4itzC');
            //console.log(data);
            data = JSON.parse(data);
            if (data.message != 'ok') {
               return ac([]);
            }
            if (data.offers.length == 0) {
                return ac([]);
            }
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];

                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }

                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.package_name = adv_offer.package_name;
                
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.daily_cap;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                tmpOffer.adv_url = adv_offer.click_url + '&click_id={clickid}&idfa={idfa}&gaid={gaid}&sub_channel={networkid}&android_id={android}'
                tmpOffer.kpi = adv_offer.kpi;
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.geo.split(',');
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {

            rj(e);
        }

    });
}

//test();