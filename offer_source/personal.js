function getPrice(val){
    try{
        return val.usd_payout;
    }catch(e){
        return 0;
    }
}

function getGeo(val){
    let country = [];
    for (let i in val.countries) {
        country.push(val.countries[i].toUpperCase())
    }
    return country;
}

function getCap(val) {
    try{
        return val;
    } catch(e) {
        return 0;
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
            console.log('personal');
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
        let data = await rp('http://dsp.persona.ly/api/campaigns?token=28f3f6c4b5fc013e84a92f81397a1d12');
        //console.log(data);
        data = JSON.parse(data);

        if (data.campaigns.length == 0) {
            return ac([]);
        }

        for (let i in data.campaigns) {

            let tmpOffer = {};
            let adv_offer = data.campaigns[i];

            if (adv_offer.tracking_url == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.payouts[0]);

            let geo = getGeo(adv_offer.payouts[0]);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.id+'';
            let view_url = '';
            if (adv_offer.payouts[0].platform == 'Android') {
                view_url = adv_offer.preview_url_android;
            } else {
                view_url = adv_offer.preview_url_ios;
            }
            tmpOffer.package_name = fun.getPackageName(view_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.campaign_name;
            tmpOffer.daily_cap = getCap(adv_offer.subscription_caps.total_cap_limit);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.tracking_url + '&clickid={clickid}&subid1={network_id}&subid2={sub_id}&idfa={idfa}&gaid={gaid}';

            tmpOffer.kpi = adv_offer.traffic_restrictions.conversion_guidelines;  //

            tmpOffer.survey_status =true;
            tmpOffer.survey_level = 1;
            tmpOffer.manually = 0; //0为api 单子 1 为s2s

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