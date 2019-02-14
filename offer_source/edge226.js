const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const req = require('request');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('edge226');
        let maxpage = 1;
        let offers=[];
        let p_offers=[];
        for(let j=1;j <= maxpage;j++){
            p_offers.push(getPage(j)) ;
        }
        let new_offers = await Promise.all(p_offers);
        for(let k in new_offers){
            offers.push.apply(offers, new_offers[k]);
        }
        ac(offers);
    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
        try {
            let data = await rp('http://leverage.echo226.com/2015-03-01/bulk?affiliate=84605678&auth=77f5ada3275e4390b215c7dc67374b75&payoutType=cpi');
            //console.log(data);
            data = JSON.parse(data);

            if (data.rows.length == 0) {
                ac([]);
            }
            for (let i in data.rows) {
                let tmpOffer = {};
                let adv_offer = data.rows[i];
               /* console.log(adv_offer.termsAndConditions);return;*/

                if(adv_offer.payoutType != 'CPI'){
                    continue;
                }
                //console.log(adv_offer.applicationLink);return;

                //offer 申请
                if (adv_offer.hasOwnProperty('trackingLink') == false) {

                    let applyOpt = {
                        method: 'POST',
                        preambleCRLF: true,
                        postambleCRLF: true,
                        uri: adv_offer.applicationLink + '?auth=77f5ada3275e4390b215c7dc67374b75',
                        multipart: [
                            {
                                'content-type': 'application/json',
                                body: JSON.stringify({"offers":[adv_offer.id]})
                            }
                        ]
                    }
                    let applyRes = await new Promise(function (a, f) {
                        req(applyOpt, function (error, response, body) {
                            a(response.body);
                        })
                    })
                    applyResJson = JSON.parse(applyRes);

                    //判断是否申请offer成功
                    if (applyResJson.status != 'Success') {
                        continue;
                    }

                    //申请完成 跳过这次 待定广告主系统更新
                    continue;
                }

                if (adv_offer.payout < 0.08) {
                    continue;
                }
                tmpOffer.payout = adv_offer.payout+'';

                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.package_name = fun.getPackageName(adv_offer.previewUrl);
                tmpOffer.daily_cap = parseInt(adv_offer.dailyCapping);
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.trackingLink + '&sub_id={clickid}&sub_id2={network_id}_{sub_id}';
                //tmpOffer.geo = [];
                tmpOffer.geo = getGeo(adv_offer.countries);
                //console.log(tmpOffer.geo);return
                tmpOffer.kpi = adv_offer.termsAndConditions;
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            nlog.error(e);
            ac([]);
        }
    });
    
}

function getGeo(val){

    try{
        return val.toUpperCase().split('|');
    }catch(e){
        return false;
    }
}