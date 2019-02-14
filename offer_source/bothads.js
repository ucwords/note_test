const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const loadCarrier = require('../model/loadcarrier');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('bothads');
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
        let data = await rp('http://publisher.bothads.com/publisherapi/recommended_offers/?uid=4573&key=68363a6c911fd68eb2af772f314fa739');
        data = JSON.parse(data);

        if (data.data.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=bothads');
        offer_ids = JSON.parse(offer_ids);
        let offer_id_arr = [];

        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(String(offer_ids[i]));
            }
        }

        //console.log(offer_id_arr);return
        for (let i in data.data) {

            let tmpOffer = {};
            let adv_offer = data.data[i];

            if (offer_id_arr.indexOf(adv_offer.oid) == -1) {
                continue;
            }

            if (adv_offer.link == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout;

            let geo = getGeo(adv_offer.country);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.oid+'';

            tmpOffer.offer_name = adv_offer.name;

            tmpOffer.daily_cap = getCap(adv_offer.caps);

            tmpOffer.platform = 'web';

            tmpOffer.adv_url = adv_offer.link + '&sub1={clickid}&sub2={network_id}_{sub_id}';

            tmpOffer.kpi = delHtmlTag(adv_offer.description);
            //tmpOffer.des = adv_offer.description;

            tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, adv_offer.carrier);

            tmpOffer.flow = adv_offer.flow.join(',');

            tmpOffer.preview = adv_offer.preview;
            tmpOffer.tag = getTag(adv_offer.streamtype);

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

function delHtmlTag(str){
    var reg = new RegExp(",|\r|\n|\t|<table>|</table>|<tr>|</tr>|<td>|</td>|<tbody>|</tbody>","g");//g,表示全部替换。
    str = str.replace(reg,"-"); //替换所有逗号 防止CSV格式有问题
    return str.replace(/<[^>]+>/g,"");//去掉所有的html标记

}

function getTag(val) {
    let tag = ['cpa'];
    let tag_original = val.split(',');
    for (let i in tag_original) {
        tag.push(tag_original[i].toLowerCase());
    }
    return tag;
}

function getGeo(val){
    let country = [];
    for (let i in val) {
        country.push(val[i].toUpperCase());
    }
    return country;
}

function getCap(val) {
    try{
        return val.amount;
    } catch(e) {
        return 0;
    }
}
