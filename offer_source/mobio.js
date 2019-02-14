const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('mobio');
        let maxpage = 2;
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
    let opt = {
        url:'http://api.mobio.affise.com/3.0/partner/offers?limit=500&page='+page,
        qs:{page:page},
        headers: {
            'User-Agent': 'Leanmobi AI system',
            'API-Key':  'aac7128b19b43a60b4086b7535adbe31c8808e99'
        },
        json: true
    };
    let offers = [];
    try {
        
        let data = await rp(opt);
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
            let geo = adv_offer.countries.join('|').toUpperCase().split('|') ;
            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;
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
        console.log('mobio has some error,please check the error logs');
       nlog.error(e);
       ac([])
    }
    });
    
}

function getPrice(p){

    if(p && p[0] && p[0].currency == 'usd'){
        return p[0].revenue+''
    }else{
        return 0;
    }
}