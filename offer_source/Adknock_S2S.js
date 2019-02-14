function getCap(val) {
    if (val < 0) {
        return 0;
    } else {
        return val;
    }
}

//test();
//
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('Adknock_S2S');
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
        let data = await rp('http://alw.vnoke.com/ad/v1?access_key=c41e759fa19f363c94610f367ea2f53b&appid=120056&format=json');
        //console.log(data);
        data = JSON.parse(data);
        //console.log(data);return;
        if (data.data.length == 0) {
            return ac([]);
        }

        for (let i in data.data.campaigns) {

            let tmpOffer = {};
            let adv_offer = data.data.campaigns[i];

            if (adv_offer.trackurl == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout.replace('$', '');

            let geo = adv_offer.allow_country;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.campaign_id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.title;
            tmpOffer.daily_cap = getCap(adv_offer.cap);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.trackurl +'&ext1={clickid}&sub_id={network_id}_{sub_id}&gaid={gaid}&idfa={idfa}';

            tmpOffer.kpi = adv_offer.offer_description;

            tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
});

}