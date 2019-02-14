function getPrice(val){
  try{
    return val[0].Payout;
  }catch(e){
    return 0;
  }
}

function getGeo(val){
  try{
    return val[0].Countries;
  }catch(e){
    return false;
  }
}

function getCap(val) {
    try{
        return parseInt(val[0].Daily_cap);
    } catch(e) {
        return 0;
    }
}

//test();
//
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('tapgerine');
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
        let data = await rp('http://api.tapgerine.net/v2/affiliate/offer/findAll/?token=LwXYQm6LCMHMs9zRjkTCYxWWyw8dp8Vg&page='+page);
        //console.log(data);
        data = JSON.parse(data);

        if (data.success != true) {
           return ac([]);
        }
        if (data.offers.length == 0) {
            return ac([]);
        }


        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            if (adv_offer.Tracking_url == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.Goals);

            let geo = getGeo(adv_offer.Goals);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.ID+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.Preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.Original_name;
            tmpOffer.daily_cap = getCap(adv_offer.Goals);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.Tracking_url + '&aff_sub={clickid}&aff_sub2={network_id}_{sub_id}&idfa={idfa}&android_id={android}';
            tmpOffer.kpi = dealKpi(adv_offer.Description);

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
    });
    
}

function dealKpi(kpi)
{
    String.prototype.stripHTML = function() {
        var reTag = /<(?:.|\s)*?>/g;
        return this.replace(reTag,"");
    }
    return kpi.stripHTML();
}