const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('applift');
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
            let data = await rp('https://bapi.applift.com/bapi_v2?token=8sCWZa2svwvxx5RzbzpGEA&format=json&v=2&min_geo_level=country');
            //console.log(data);
            data = JSON.parse(data);

            if (data.results.length == 0) {
                return ac([]);
            }

            for (let i in data.results) {

                let adv_offer = data.results[i];
                var Pack = adv_offer.app_details.bundle_id;

                for (let a in adv_offer.offers) {
                    let tmpOffer = {};  //指针
                    let offer = adv_offer.offers[a];

                    let appPack = Pack;

                    if (offer.click_url == null) {
                        continue;
                    }
                    tmpOffer.payout = dealPayout(offer.goal_payouts[0]);

                    let geo = dealGeo(offer.geo_targeting);

                    if ((!geo) || (tmpOffer.payout < 0.08)) {
                        continue;
                    }
                    tmpOffer.geo = geo;

                    tmpOffer.adv_offer_id = offer.offer_id + '';
                    tmpOffer.offer_name = offer.offer_name;

                    tmpOffer.package_name = appPack;
                    if (!tmpOffer.package_name) {
                        continue;
                    }

                    tmpOffer.daily_cap = 0;
                  
                    if (tmpOffer.package_name.indexOf(".") > 0) {
                        tmpOffer.platform = 'android';
                    } else {
                        tmpOffer.platform = 'ios';
                        tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                    }

                    tmpOffer.adv_url = offer.click_url.replace('{click_id}', '{clickid}') + '&source={network_id}_{sub_id}';

                    if (offer.goal_type == 'CPA') {
                        tmpOffer.kpi = 'A = '+ offer.goal_payouts[0].goal_name;
                    }
                    tmpOffer.survey_level = 1;
                    tmpOffer.manually = 0;//停用探测,非空都不探测
                    tmpOffer.survey_status = true;
                    offers.push(tmpOffer);
                }

              //  console.log(offers); return
            }
            //console.log(offers);
            ac(offers);
        } catch (e) {
            rj(e);
        }
    });

}

function dealPayout(payout)
{
    if (payout.payout > 0) {
        return payout.payout / 1000;
    }
    return 0;
}

function dealGeo(geo)
{
    let offers = [];
    for (let i in geo) {
        offers.push(geo[i].country_code)
    }
    return offers;
}
