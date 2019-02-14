const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('inplayable');
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
            let data = await rp('http://apipull.inplayable.com/index.php?m=server&p=getoffer&sid=322&secret=d063077a41e2f89b5c73daf878c821cf&pagesize=5000&page='+page);
            //console.log(data);
            data = JSON.parse(data);
            
            if (data.status!='success') {
                
                ac([]);
            }

            if (data.datas.length == 0) {
                
                ac([]);
            }
            for (let i in data.datas) {
                let tmpOffer = {};
                let adv_offer = data.datas[i];
          
                if(adv_offer.isincent != '0'){
                    continue;
                }
                tmpOffer.payout = adv_offer.price+'';
                if (adv_offer.price < 0.08) {
                    continue;
                }
                tmpOffer.adv_offer_id = adv_offer.id;
                tmpOffer.package_name = adv_offer.app_pkg;
                tmpOffer.daily_cap = parseInt(adv_offer.daily_cap);
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.click_url.replace('{aff_sub}','{clickid}').replace('{channel}','{network_id}-{sub_id}');
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.countries;
                tmpOffer.kpi = adv_offer.kpitype;
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            nlog.error(e);
            ac([]);
        }
    });
    
}