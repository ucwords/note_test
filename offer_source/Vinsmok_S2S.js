const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('Vinsmok_S2S');
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
        let data = await rp('http://vinsmok.hoapi0.com/v1?cid=vinsmok&token=470c4d40d51143e8ae7026476e9f5d98');
        data = JSON.parse(data);
        //console.log(data);return
        if (data.offers.length == 0) {
            return ac([]);
        }

        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            /*let filter = [ 2712,2713,2725,2686,2687,1597
            ];
            if (filter.indexOf(adv_offer.network_offer_id) == -1) {
                continue;
            }*/
            let tracking = adv_offer.tracking_link;
            if (tracking == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.price;

            let geo = adv_offer.geo;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.campid;

            tmpOffer.offer_name = adv_offer.offer_name;

            tmpOffer.daily_cap = getCap(adv_offer.daily_cap);

            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_link);
            if (!tmpOffer.package_name) {
                continue;
            }

            tmpOffer.preview = adv_offer.preview_link;

            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.tracking_link.replace('[click_id]', '{clickid}').replace('[source]','{network_id}_{sub_id').replace('[idfa]', '{idfa}').replace('[advertising_id]', '{gaid}');

            tmpOffer.kpi = delHtmlTag(adv_offer.performance_criteria);
            //tmpOffer.des = delHtmlTag(adv_offer.performance_criteria);
            tmpOffer.tag = ['cpi'];

            tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;

            tmpOffer.strict_geo = 1;
            tmpOffer.private = 1; //1 == private

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {
        rj(e);
    }
});

}

function delHtmlTag(str){
    var reg = new RegExp(",|<table>|</table>|<tr>|<br>|</tr>|<td>|</td>|<tbody>|</tbody>|\n|\t","g");//g,表示全部替换。
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
