const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('adunite_s2s');
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
        let data = await rp('http://oapi.hotmobi.com/getOffers?aff_id=80&sign=ed88e93e302d6f7c80893af4ade4a695&page=1&pagesize=2000');
        console.log(data); return
        data = JSON.parse(data);

        if (data.offers.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=adunite_s2s');
        offer_ids = JSON.parse(offer_ids);
        let offer_id_arr = [];

        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(parseInt(offer_ids[i]));
            }
        }

        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            if (adv_offer.click_url == null) {
                continue;
            }

            if (offer_id_arr.length > 0) {
                if (offer_id_arr.indexOf(adv_offer.id) == -1) {
                    continue;
                }
            }

            tmpOffer.payout = adv_offer.payout;

            let geo = adv_offer.country;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.name;
            tmpOffer.daily_cap = getCap(adv_offer.cap);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            tmpOffer.adv_url = adv_offer.click_url.replace('{click_id}','{clickid}').replace('{source_id}', '{network_id}_{sub_id}').replace('{ios_idfa}', '{idfa}').replace('{google_aid}','{gaid}');

            tmpOffer.kpi = adv_offer.description;

            tmpOffer.preview = adv_offer.preview_url;
            tmpOffer.tag = ['cpi'];

            //tmpOffer.survey_level = 1;
            //tmpOffer.manually = 1;//停用探测,非空都不探测
            //tmpOffer.survey_status = true;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
});

}

function getCap(val) {
    if (val >= 0) {
        return val
    } else {
        return 0;
    }
}
