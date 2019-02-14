
function getCap(val) {
    if (val >= 0) {
        return val;
    }
    return 0;
}

//test();
//
const rp = require('request-promise-native');
const fun = require('../model/functions');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('rivermob');
            let maxpage = 1;
            let offers=[];
            let p_offers=[];
            for(let j=1;j <= maxpage;j++){
                p_offers.push(getPage(j)) ;
            }
            //里面有多个await Promise.all写法让其同时触发 节约时间
            let new_offers = await Promise.all(p_offers); //
            for(let k in new_offers){
                offers.push.apply(offers, new_offers[k]); //合并
            }
            ac(offers);
        }catch (e) {
            rj(e);
        }

    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
    try {
        let data = await rp('http://api.vortexmedia.mobi/v1/offer?token=1d2f346e7daf472aa228f80987e48745');
        //console.log(data);
        data = JSON.parse(data);

        if (data.data.length == 0) {
            return ac([]);
        }

        for (let i in data.data) {

            let tmpOffer = {};
            let adv_offer = data.data[i];

            //console.log(adv_offer);return;
            if (adv_offer.offer_url == null) {
                continue;
            }
            if (adv_offer.preview_url == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout;

            let geo = adv_offer.country;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',')

            tmpOffer.adv_offer_id = adv_offer.id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.name;
            tmpOffer.daily_cap = getCap(adv_offer.daily_cap);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.offer_url + '&t1={clickid}&sub_id={network_id}_{sub_id}';

            tmpOffer.kpi = adv_offer.terms;

            offers.push(tmpOffer);
        }
        //
        ac(offers);
    } catch (e) {

        rj(e);
    }
});

}
