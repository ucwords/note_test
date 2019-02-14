const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('chestnut_s2s');
            let maxpage = 1;
            let offers=[];
            let p_offers=[];
            for(let j=1;j <= maxpage;j++){
                p_offers.push(getPage(j)) ;
            }
            //里面有多个await Promise.all写法让其同时触发 节约时间
            let new_offers = await Promise.all(p_offers);
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
        let data = await rp('http://api.ichestnut.net/v1/apps/get?code=b439ae996acd07ba9517a1cc7e374e9d');
        //console.log(data);
        data = JSON.parse(data);

        if (data.apps.length == 0) {
            return ac([]);
        }

        let offer_ids = await rp('http://portal.leanmobi.com/?s=admin/auto_pull/getOfferIdsByAdvName&adv=chestnut_s2s');
        offer_ids = JSON.parse(offer_ids);
        let offer_id_arr = [];

        if (offer_ids.offer_id.length > 0) {
            offer_ids = offer_ids.offer_id.split(',');
            for (let i in offer_ids)  {
                offer_id_arr.push(parseInt(offer_ids[i]));
            }
        }

        for (let i in data.apps) {

            let adv_offer = data.apps[i];
            
            for (let a in adv_offer.offers) {
                let tmpOffer = {}; //指针
                let offer = adv_offer.offers[a];

                if (offer_id_arr.length > 0) {
                    if (offer_id_arr.indexOf(offer.offer_id) == -1) {
                        continue;
                    }
                }

                tmpOffer.payout = offer.payout + '';

                let geo = offer.countries;

                if ((!geo) || (tmpOffer.payout < 0.08)) {
                    continue;
                }
                tmpOffer.geo = geo;

                tmpOffer.adv_offer_id = offer.offer_id + '';
                tmpOffer.package_name = fun.getPackageName(offer.preview_link);
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.preview = offer.preview_link;

                tmpOffer.offer_name = offer.offer_name;
                tmpOffer.daily_cap = offer.cap_daily;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }

                tmpOffer.adv_url = offer.tracking_link + '&click={clickid}&aff_sub={network_id}_{sub_id}&gaid={gaid}&idfa={idfa}';
                tmpOffer.kpi = offer.description;

                tmpOffer.tag = ['cpi'];

                tmpOffer.survey_level = 1;
                tmpOffer.manually = 1;//停用探测,非空都不探测
                tmpOffer.survey_status = true;

                tmpOffer.strict_geo = 1;

                tmpOffer.private = 1; //1 == private

                offers.push(tmpOffer);
            }
        }
        ac(offers);
    } catch (e) {
        rj(e);
    }
    });
    
}
