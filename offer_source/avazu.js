const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function () {
    return new Promise(async (ac, rj) => {
        let offers = []
        console.log('avazu');
        try {
            let data = await rp('http://api.c.avazunativeads.com/s2s?pagenum=9999&campaigndesc=1&enforcedv=device_id&sourceid=33321');
            //console.log(data);
            data = JSON.parse(data);
            if (data.status != 'OK') {
               return ac([]);
            }
            if (data.ads.ad.length == 0) {
                return ac([]);
            }

            for (let i in data.ads.ad) {
                let tmpOffer = {};
                let adv_offer = data.ads.ad[i];

                if(adv_offer.incent != 'no'){
                    continue;
                }

                tmpOffer.payout = getPrice(adv_offer.payout);
                if (tmpOffer.payout < 0.08) {
                    continue;
                }
                tmpOffer.category = (adv_offer.appcategory+'').toUpperCase().replace(/\ +/g,"_");
                tmpOffer.adv_offer_id = adv_offer.campaignid;
                tmpOffer.package_name = adv_offer.pkgname;
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
                tmpOffer.adv_url = adv_offer.clkurl + '&dv1={clickid}&device_id={gaid}{idfa}&nw_sub_aff={network_id}_{sub_id}'
                tmpOffer.kpi = adv_offer.campaigndesc;
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.countries.split('|');
                if(tmpOffer.geo.indexOf('TW') > -1){
                    continue;
                }
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {

            rj(e);
        }

    });
}

function getPrice(val){
    if(val.charAt(val.length-1) == '$'){
        return val.substr(0, val.length - 1);
    }else{
        return 0;//不是美金 触发抛弃
    }
}
//test();