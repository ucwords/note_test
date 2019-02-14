function getPrice(val){
    try{
        return val[0].Payout;
    }catch(e){
        return 0;
    }
}

function getGeo(val){
    try{
        return val.geoTargeting.country[0];
    }catch(e){
        return false;
    }
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
            console.log('affle');
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
        let data = await rp('http://mapi.affle.co/publisher.php?cId=all&key=500c7941c4ae707570924ed22793f684');
        //console.log(data);
        data = JSON.parse(data);


        if (data.length == 0) {
            return ac([]);
        }

        for (let i in data.data) {

            let tmpOffer = {};
            let adv_offer = data.data[i];

            if (adv_offer.clickTrackingUrl == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout;

            let geo = getGeo(adv_offer.targeting);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.offerId+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.assetUrl);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.campaignName;
            tmpOffer.daily_cap = getCap(adv_offer.dailyInstallCap);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            let platform = dealTracking(tmpOffer.platform);
            tmpOffer.adv_url = adv_offer.clickTrackingUrl.replace('{Clickid}','{clickid}').replace('{Sub_ID}', '{network_id}_{sub_id}').replace('{GAID/IDFA}', platform).replace('{Sub3}','');

            tmpOffer.kpi = adv_offer.campaignKPI;

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