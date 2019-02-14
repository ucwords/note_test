const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('pwngames');
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
        let op = {
            method: 'GET',
            url:'https://api.eflow.team/v1/affiliates/offersrunnable',
            headers:{
                'x-eflow-api-key':'W3E4HSotSmG6lskihdtKeA'
            }
        };
        let data = await rp(op);
        data = JSON.parse(data);
        //console.log(data);return
        if (data.offers.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=pwngames');
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

            if (offer_id_arr.length > 0) {
                if (offer_id_arr.indexOf(adv_offer.network_offer_id) == -1) {
                    continue;
                }
            }

            if (adv_offer.tracking_url == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.relationship.payouts.entries);

            let geo = getGeo(adv_offer.relationship.ruleset.countries);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.network_offer_id+'';

            tmpOffer.offer_name = adv_offer.name;

            tmpOffer.daily_cap = getCap(adv_offer.daily_conversion_cap);

            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }

            tmpOffer.preview = adv_offer.preview_url;

            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.tracking_url + '&sub2={clickid}&sub1={network_id}_{sub_id}&idfa={idfa}&google_aid={gaid}';

            tmpOffer.kpi = delHtmlTag(adv_offer.html_description);
            tmpOffer.des = delHtmlTag(adv_offer.html_description);
            tmpOffer.tag = ['cpi'];

            /*tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;*/

            tmpOffer.strict_geo = 1;

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
function getCap(val) {
    if (val >= 0) {
        return val
    } else {
        return 0;
    }
}

function getCarrier(val) {
    let carrier = [];
    for (let i in val) {
        carrier.push(val[i].name.toLowerCase());
    }

    return carrier;
}

function getGeo(val) {
    let geo = [];
    for (let i in val) {
        geo.push(val[i].country_code);
    }

    return geo;
}

function getPrice(val){
    try{
        return val[0].payout_amount;
    }catch(e){
        return 0;
    }
}
