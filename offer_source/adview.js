
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('adview');
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
            let data = await rp('http://server.adview.com/api/public/campaigns?token=36894a2c-353c-48c1-9a75-bcf4c25cb04d');
            //console.log(data);
            data = JSON.parse(data);

            if (data.campaigns_info.length == 0) {
                return ac([]);
            }

            for (let i in data.campaigns_info) {

                let tmpOffer = {};
                let adv_offer = data.campaigns_info[i];
                //console.log(adv_offer);return;
                if (adv_offer.tracking_link == null) {
                    continue;
                }
                tmpOffer.payout = adv_offer.payout;

                let geo = adv_offer.target_info.geo;

                if ((!geo) || (tmpOffer.payout < 0.08)) {
                    continue;
                }
                tmpOffer.geo = geo;

                tmpOffer.adv_offer_id = adv_offer.campaign_id+'';
                tmpOffer.package_name = fun.getPackageName(adv_offer.product_info.preview_link);
                if (!tmpOffer.package_name) {
                    continue;
                }

                tmpOffer.offer_name = adv_offer.campaign_name;
                tmpOffer.daily_cap = adv_offer.day_cap;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }

                tmpOffer.adv_url = adv_offer.tracking_link + '&sid={clickid}&subid={network_id}_{sub_id}&gaid={gaid}&idfa={idfa}';

                tmpOffer.kpi = adv_offer.kpi;

                offers.push(tmpOffer);
            }
            ac(offers);
        } catch (e) {

            rj(e);
        }
    });
}


