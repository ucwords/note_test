const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const loadCarrier = require('../model/loadcarrier');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('btomorrow');
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
    try {
        let op = {
            method: 'GET',
            url:'http://adnew.api.offerslook.com/aff/v1/batches/offers?type=personal&sort=-id&filters[status]=active&contains=description&limit=100&offset='+page,
            headers:{
                'Authorization': 'Basic ZmFubnlAbGVhbm1vYmkuY29tOjFiNGVkNzUwNTkxNDQ0MzRhMDc1YjQzY2VmNjdlZDEz'
            }
        };
        let data = await rp(op);
        data = JSON.parse(data);

        if (data.data.rowset.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=btomorrow');
        offer_ids = JSON.parse(offer_ids);
        let offer_id_arr = [];

        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(parseInt(offer_ids[i]));
            }
        }

        for (let i in data.data.rowset) {

            let tmpOffer = {};
            let adv_offer = data.data.rowset[i];

            let item_offer = adv_offer.offer;
            let item_geo = adv_offer.offer_geo;
            let item_cap = adv_offer.offer_cap;

            if (offer_id_arr.length > 0) {
                if (offer_id_arr.indexOf(item_offer.id) == -1) {
                    continue;
                }
            }


            if (item_offer.tracking_link == null) {
                continue;
            }
            tmpOffer.payout = item_offer.payout;

            let geo = getGeo(item_geo);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = item_offer.id+'';

            tmpOffer.offer_name = item_offer.name;

            tmpOffer.daily_cap = getCap(item_cap);

            tmpOffer.platform = 'web';

            tmpOffer.preview = item_offer.preview_url;
            tmpOffer.adv_url = item_offer.tracking_link + '&aff_sub1={clickid}&source_id={network_id}_{sub_id}';

            tmpOffer.kpi = item_offer.description;
            tmpOffer.des = item_offer.description;

            tmpOffer.carrier = loadCarrier.search(tmpOffer.geo, item_offer.carrier);

            tmpOffer.tag = getTag(item_offer.category);

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


function getTag(val) {
    let tag = ['cpa'];
    let tag_original = val.split(',');
    for (let i in tag_original) {
        tag.push(tag_original[i].toLowerCase());
    }
    return tag;
}



function getGeo(val)
{
    try{
        let country = [];
        for (let i in val.target) {
            country.push(val.target[i].country_code);
        }

        return country;

    }catch(e){
        return false;
    }
}


function getCap(val){
    if (val) {
        return val.cap_conversion;
    } else {
        return 0
    }
}
