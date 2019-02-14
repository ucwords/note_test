const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('adstard');
        try {
            let data = await rp('http://service.adstard.com/api/offer/ads?affId=135&security=DuMak5NbquAHEkq7');
            //console.log(data);
            data = JSON.parse(data);
            if (data.code != '200') {
               return ac([]);
            }
            if (data.ads.length == 0) {
                return ac([]);
            }
            for (let i in data.ads) {
                let tmpOffer = {};
                let adv_offer = data.ads[i];

                tmpOffer.payout = adv_offer.offer_price;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.package_name = adv_offer.pkg_name;
                
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
                tmpOffer.adv_url = adv_offer.track_url + '&click_id={clickid}&Idfa={idfa}&Gaid={gaid}&sub_id={networkid}'
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