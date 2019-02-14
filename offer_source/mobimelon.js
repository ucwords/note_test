const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const loadCarrier = require('../model/loadcarrier');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('mobimelon');  //更新
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
        let data = await rp('http://publisher.mobimelon.com/publisherapi/offers/?uid=610&key=8df450cd17dc6c32764339b718387bcf&avail=available&limit=5000');
        data = JSON.parse(data);

        if (data.data.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=mobimelon');
        offer_ids = JSON.parse(offer_ids);
        let offer_id_arr = [];

        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(String(offer_ids[i]));
            }
        }
        //offer_id_arr = ['40322']
        for (let i in data.data) {

            let tmpOffer = {};
            let adv_offer = data.data[i];

            if (offer_id_arr.length > 0) {
                if (offer_id_arr.indexOf(adv_offer.oid) == -1) {
                    continue;
                }
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
            tmpOffer.des = delHtmlTag(adv_offer.description);

            tmpOffer.preview = adv_offer.preview;

            tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, adv_offer.carrier);

            tmpOffer.flow = adv_offer.flow.join(',');

            tmpOffer.tag = getTag(adv_offer.streamtype);

            tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;
            tmpOffer.strict_geo = 1;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {
        console.log('error'+page);
        console.log(e);
        nlog.error(e);
        rj(e);
    }
});

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
    if (val){
        return val.amount;
    } else {
        return 0;
    }
}

function delHtmlTag(str){
    var reg = new RegExp(",|<table>|</table>|<tr>|<br>|</tr>|<td>|</td>|<tbody>|</tbody>|\n|\t","g");//g,表示全部替换。
    str = str.replace(reg,"-"); //替换所有逗号 防止CSV格式有问题
    return str.replace(/<[^>]+>/g,"");//去掉所有的html标记

}
