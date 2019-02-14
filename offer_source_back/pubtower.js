const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('pubtower');
        try {
            let data = await rp('http://api.pubtower.com/api/offer/v3?cid=9981&token=OECaeGO2u5Cbzbjo');
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
                if (adv_offer.pay_model != 'cpi'){
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.package_name = adv_offer.pkg;
                
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.daily_caps;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                tmpOffer.adv_url = adv_offer.tracking_link + '&click_id={clickid}&idfa={idfa}&gaid={gaid}&sub_channel={networkid}&android_id={android}'
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