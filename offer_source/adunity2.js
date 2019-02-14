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
            console.log('adunity2');
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
        let data = await rp('http://api.c.adunity.mobi/ads2s?sourceid=33765&pagecount=1000');
        //console.log(data);
        data = JSON.parse(data);


        if (data.offers.offer.length == 0) {
            return ac([]);
        }

        for (let i in data.offers.offer) {

            let tmpOffer = {};
            let adv_offer = data.offers.offer[i];

            if (adv_offer.click_url == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.price.replace('$', '');

            let geo = adv_offer.geos;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split('|');

            tmpOffer.adv_offer_id = adv_offer.offerid+'';
            tmpOffer.package_name = adv_offer.package;
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.title;
            tmpOffer.daily_cap = getCap(adv_offer.convflow);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            let platform = dealTracking(tmpOffer.platform);
            tmpOffer.adv_url = adv_offer.click_url+ '&dv1={clickid}&sub_aff={network_id}_{sub_id}&device_id='+platform;

            tmpOffer.kpi = adv_offer.kpi;

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