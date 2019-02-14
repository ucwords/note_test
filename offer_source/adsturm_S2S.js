const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('adsturm_S2S');//
            let maxpage = 1;
            let offers=[];
            let p_offers=[];
            for(let j=1;j <= maxpage;j++){
                p_offers.push(getPage(j)) ;
            }
            //里面有多个await Promise.all写法让其同时触发 节约时间
            let new_offers = await Promise.all(p_offers); //await 表示紧跟在后面的表达式需要等待结果 await命令后面，可以是 Promise 对象和原始类型的值（数值、字符串和布尔值，但这时等同于同步操作
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
        let data = await rp('http://offer.adsturm.com/adOffer/offer/list?affiliateId=20161&key=22f50c157b4153d1653f94e82904511e');
        data = JSON.parse(data);
        //console.log(data);return
        if (data.offers.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=adsturm_S2S');
        offer_ids = JSON.parse(offer_ids);

        let offer_id_arr = [];
        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(String(offer_ids[i]));
            }
        }
        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            if (offer_id_arr.indexOf(adv_offer.offerId) == -1) {
                continue;
            }

            //console.log(offer_id_arr);return;
            if (adv_offer.trackLink == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout;

            let geo = adv_offer.countries;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }

            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.offerId+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.previewLink);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.offerName;
            tmpOffer.daily_cap = adv_offer.capDaily;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            let platform = dealTracking(tmpOffer.platform);

            tmpOffer.adv_url = adv_offer.trackLink+ '&clickId={clickid}&subAffid={network_id}_{sub_id}&deviceInfo='+platform;

            tmpOffer.kpi = adv_offer.kpi;

            tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;

            tmpOffer.strict_geo = 1;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
});

}

function dealTracking(platform)
{
    try{
        if (platform == 'ios') {
            return '{idfa}';
        } else {
            return '{gaid}';
        }

    }catch (e){
        return e;
    }
}