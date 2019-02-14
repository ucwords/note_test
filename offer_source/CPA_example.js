const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const loadCarrier = require('../model/loadcarrier');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('actwebmedia');
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
            url:'http://api.actwebmedia.affise.com/3.0/offers?limit=1000',
            headers:{
                'Api-Key':'c6a086067062975ecdf1ff4bb07897d123ec88a7'
            }
        };
        let data = await rp(op);
        data = JSON.parse(data);
        //console.log(data);return
        if (data.offers.length == 0) {
            return ac([]);
        }

        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            let filter = [1344,1583,1621,1410,1599,1550,1389,1553,1513,1454,1538,1139,1234,1548,1584,1500,1528,1581,
                1568,1226,949,1532,1595,1596,1296, 1297, 1575, 1168, 1505, 1483, 1290, 1585, 1433, 1275, 1113, 531,
                1266, 945, 1577, 1220, 1016, 1447, 1572, 1604, 1136, 1134, 1522,1325,1630,698,1015,1173,1637,
                1319,  1316, 1591, 1647,1651, 1599, 1596, 1530
            ];
            if (filter.indexOf(adv_offer.id) == -1) {
                continue;
            }
            if (adv_offer.link == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.payments[0]);

            let geo = adv_offer.countries;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.id+'';

            tmpOffer.offer_name = adv_offer.title;

            tmpOffer.daily_cap = adv_offer.cap;

            tmpOffer.platform = 'web';
            tmpOffer.preview = adv_offer.preview_url;

            tmpOffer.adv_url = adv_offer.link + '&sub1={clickid}&sub2={network_id}_{sub_id}';

            let carrier =  getCarrier(adv_offer.restriction_isp);
            tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, carrier);

            tmpOffer.kpi = delHtmlTag(adv_offer.description);
            tmpOffer.des = delHtmlTag(adv_offer.description);
            tmpOffer.tag = ['cpa'];

            tmpOffer.survey_level = 1;
            tmpOffer.manually = 1;//停用探测,非空都不探测
            tmpOffer.survey_status = true;

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

function getCarrier(val) {
    let carrier = [];
    for (let i in val) {
        carrier.push(val[i].name.toLowerCase());
    }

    return carrier;
}

function getPrice(val){
    try{
        return val.revenue;
    }catch(e){
        return 0;
    }
}
