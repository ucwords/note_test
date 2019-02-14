const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('xapads');
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
            let option = {
                url: 'http://api.xapads.affise.com/3.0/offers?limit=1000',
                method: 'GET',
                headers: {
                    'Api-Key': 'c497b6062d20f57a7aa3ba100417dfd059223c76'
                }
            };
            let data = await rp(option);
            data = JSON.parse(data);
            //console.log(data);return;
            if (data.offers.length == 0) {
                return ac([]);
            }

            let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=xapads');
            offer_ids = JSON.parse(offer_ids);
            //console.log(offer_ids);return;
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
                    if (offer_id_arr.indexOf(adv_offer.id) == -1) {
                        continue;
                    }
                }

                if (adv_offer.link == null) {
                    continue;
                }
                tmpOffer.payout = adv_offer.payments[0].revenue;

                let geo = getGeo(adv_offer.payments[0].countries);

                if ((!geo) || (tmpOffer.payout < 0.08)) {
                    continue;
                }
                tmpOffer.geo = geo;

                tmpOffer.adv_offer_id = adv_offer.id+'';
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

                tmpOffer.adv_url = adv_offer.link +'&sub2={clickid}&sub1={network_id}_{sub_id}';

                tmpOffer.kpi = delHtmlTag(adv_offer.kpi.en);

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
    var reg = new RegExp(",|\r|\n|\t|<table>|</table>|<tr>|</tr>|<td>|</td>|<tbody>|</tbody>|&nbsp;","g");//g,表示全部替换。
    str = str.replace(reg,""); //替换所有逗号 防止CSV格式有问题
    return str.replace(/<[^>]+>/g,"");//去掉所有的html标记

}

function getCap(val) {
    if (0 <= val) {
        return val;
    } else {
        return 0;
    }
}

function getGeo(val) {
    let geo = [];
    for (let i in val) {
        geo.push(val[i].toUpperCase())
    }

    return geo;
}