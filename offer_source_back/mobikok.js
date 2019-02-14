const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('mobikok');
        try {
            let data = await rp('http://ssp.mobikok.com/inter/apps!get.action?s=ddb7cfbc-b614-499a-b700-b8fa136a862a');
            //console.log(data);
            data = JSON.parse(data);
            if (data.status != 'success') {
               return ac([]);
            }
            if (data.offers.length == 0) {
                return ac([]);
            }
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];

                tmpOffer.payout = adv_offer.payout;
                if (tmpOffer.payout < 0.08 || tmpOffer.payout > 10) {
                    continue;
                }
                if (adv_offer.currency != 'USD'){
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.package_name = adv_offer.pkgName;
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.caps;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                let adv_url_info = adv_offer.trackingUrl.split('&s1=');
                tmpOffer.adv_url = adv_url_info[0]+'&s1={clickid}&affSub={networkid}&gaid={gaid}&idfa={idfa}'
                //tmpOffer.kpi = adv_offer.kpi;
                tmpOffer.geo = [];
                let area = adv_offer.area;
                if ((!area) || (area.length == 0)) {
                    continue;
                }
                for (let t in area) {
                    tmpOffer.geo.push(area[t].country); 
                }
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {

            rj(e);
        }

    });
}

//test();