const rp = require('request-promise-native');
const nlog = require('../model/nlog');
//http://api.cliikynetwork.com/v2/offers?token=fff3e82eebccd2b83ce5f9b4dfe60a5c&c=2137&pageSize=1000&page=1
exports.getOffer = function () {
    return new Promise(async function (ac, rj) {
        console.log('clickly');
        let maxpage = 3;
        let offers = [];
        let p_offers = [];
        for (let j = 1; j <= maxpage; j++) {
            p_offers.push(getPage(j));

        }
        let new_offers = await Promise.all(p_offers);
        for (let k in new_offers) {
            offers.push.apply(offers, new_offers[k]);
        }
        ac(offers);
    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
        try {
            let data = await rp('http://api.cliikynetwork.com/v2/offers?token=fff3e82eebccd2b83ce5f9b4dfe60a5c&c=2137&pageSize=1000&page=' + page);
            //console.log(data);
            data = JSON.parse(data);

            if ((data.code != 200) || data.data.length == 0) {
                ac([]);
            }

            for (let i in data.data) {
                let tmpOffer = {};
                let adv_offer = data.data[i];
                if (adv_offer.currency != 'USD') {
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
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                    tmpOffer.platform = 'ios';
                }
    
                tmpOffer.payout = adv_offer.price;
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.daily_cap = adv_offer.cap;
                if (!adv_offer.trackingLink) {
                    continue;
                }
                tmpOffer.adv_url = adv_offer.trackingLink + '&s2={clickid}&s1={networkid}&gaid={gaid}&idfa={idfa}';
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