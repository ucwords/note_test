function getGeo(val){
    let geo = [];
    for (let i in val) {
        let str = val[i].country;

        geo.push(str);
    }

    return geo;
}
//
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('taptica');
            let maxpage = 2;
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
    try { //&countries=US.TW,KR,IN,ID,JP,MY,PH,TR

        if (page === 1) {
            var url = 'https://api.taptica.com/v2/bulk?token=EjaWa3xAcF8nxjwDfcVgUQ%3d%3d&version=2&format=json&platforms=iPhone&noCreative=True';
        } else {
            var url = 'https://api.taptica.com/v2/bulk?token=EjaWa3xAcF8nxjwDfcVgUQ%3d%3d&version=2&format=json&platforms=Android&noCreative=True';
        }
        //console.log(url);return;
        let data = await rp(url);

        //console.log(data);return;
        data = JSON.parse(data);

        if (data.Data.length == 0) {
            return ac([]);
        }
        for (let i in data.Data) {

            let tmpOffer = {};
            let adv_offer = data.Data[i];

            if (adv_offer.TrackingLink == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.Payout+'';

            let geo = getGeo(adv_offer.SupportedCountriesV2);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.OfferId+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.PreviewLink);
            if (!tmpOffer.package_name) {
                continue;
            } 
            tmpOffer.offer_name = adv_offer.Name;
            tmpOffer.daily_cap = 50;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.TrackingLink + '&tt_aff_clickid={clickid}&tt_idfa={idfa}&tt_advertising_id={gaid}&tt_sub_aff={network_id}_{sub_id}&tt_app_name={aff_sub5}';
            tmpOffer.survey_status=true;
            tmpOffer.survey_level=1;
            tmpOffer.manually = 0;//停用探测
            tmpOffer.kpi = adv_offer.Description;

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
            return '';
        } else {
            return '{gaid}';
        }

    }catch (e){
        return e;
    }
}