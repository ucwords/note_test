const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('appult');
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
        let data = await rp('http://appult.fuseclick.com/api/v2/getOffers?key=0A11DE177D6EF1E6675C7AED84CD70A2&a=183&page=1&limit=1000');
        //console.log(data);
        data = JSON.parse(data);

        if (data.data.content.length == 0) {
            return ac([]);
        }

        for (let i in data.data.content) {

            let tmpOffer = {};
            let adv_offer = data.data.content[i];

            if (adv_offer.tracking_link == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout;

            let geo = adv_offer.geo_countries;

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
            tmpOffer.daily_cap = 0;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            let platform = dealTracking(tmpOffer.platform);

            tmpOffer.adv_url = adv_offer.tracking_link+ '&aff_click_id={clickid}&sub_affid={network_id}_{sub_id}&device_id='+platform;

            tmpOffer.kpi = adv_offer.description;

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