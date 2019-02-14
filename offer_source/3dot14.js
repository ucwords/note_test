function getPrice(val){
  try{
    if(val[0].currency != 'usd'){
        return 0;
    }
    return val[0].revenue;
  }catch(e){
    return 0;
  }
}

function getGeo(val){
  try{
    return val.join('|').toUpperCase();
  }catch(e){
    return false;
  }
}


//test();
//
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('3.14');
        let maxpage = 3;
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
        let data = await rp('http://api.3point14.affise.com/3.0/partner/offers?API-Key=b759ae79c0affde34cdfb10a2372954fe5979b0b&page='+page);
        //console.log(data);
        data = JSON.parse(data);
        if (data.status != 1) {
           return ac([]);
        }
        if (data.offers.length == 0) {
            return ac([]);
        }

        for (let i in data.offers) {
            let tmpOffer = {};
            let adv_offer = data.offers[i];

            if(!adv_offer.is_cpi){
                continue;
            }

            tmpOffer.payout = getPrice(adv_offer.payments);
            let geo = getGeo(adv_offer.countries);
            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split('|');
            tmpOffer.adv_offer_id = adv_offer.id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.title;
            tmpOffer.daily_cap = 0;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }
            tmpOffer.adv_url = adv_offer.link + '&sub1={clickid}&sub2={network_id}_{sub_id}&sub3={gaid}{idfa}';
            tmpOffer.kpi = adv_offer.kpi.en;
            offers.push(tmpOffer);
        }

        ac(offers);
    } catch (e) {

        rj(e);
    }
    });
    
}