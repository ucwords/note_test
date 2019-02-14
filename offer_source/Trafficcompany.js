const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const loadCarrier = require('../model/loadcarrier');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('Trafficcompany');
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
        let data = await rp('https://www.trafficcompany.com/feed/offers?access-token=e7aa9bffea05bcf55c4709c22b5ae93f&format=json');
        data = JSON.parse(data);

        if (data.length == 0) {
            return ac([]);
        }

        for (let i in data) {

            let tmpOffer = {};
            let adv_offer = data[i];
            /*let filter = [];
            if (filter.indexOf(adv_offer.oid) == -1) {
                continue;
            }*/

            if (adv_offer.url == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.payout);

            let geo = getGeo(adv_offer.countries);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.id+'';

            tmpOffer.offer_name = adv_offer.name;

            tmpOffer.daily_cap = 0;

            tmpOffer.platform = 'web';

            tmpOffer.adv_url = adv_offer.url + '&sub1={clickid}&sub2={network_id}_{sub_id}';

            tmpOffer.kpi = adv_offer.description;
            tmpOffer.des = adv_offer.description;

            let carrier_arr = getCarrier(adv_offer.carriers);
            tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, carrier_arr);

            tmpOffer.flow = adv_offer.flow;

            tmpOffer.preview = adv_offer.preview;
            tmpOffer.tag = getTag(adv_offer.content_type);

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
function getCarrier(val) {
    let carrier = [];
    for (let i in val) {
        carrier.push(val[i].name.toLowerCase());
    }

    return carrier;
}

function getPrice(val) {
    try {
        return val.value;
    } catch (e) {
        return false;
    }
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
        country.push(i.toUpperCase());
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
