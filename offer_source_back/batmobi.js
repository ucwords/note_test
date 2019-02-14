const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('batmobi');
        let maxpage = 6;
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
    	let apk_list=[
    	'com.salvia.app.privacyprotector',
    	'com.symantec.applock',
    	'com.gclinux.photoget',
    	'com.sinyee.babybus.repairshop',
    	'com.gclinux.douyingetdown',
    	'com.baicaidd.app.andorid',
    	'com.androidesk',
    	'com.micr.todos'
    	]
        let offers = [];
        try {
            let data = await rp('http://bulk3.batmobi.net/api/network?app_key=FIY7A7YGMKR3QUPKP20XIZ46&limit=500&page='+page);
            data = JSON.parse(data);
            if (data.status!=200 || !data.offers) {
                ac([]);
            }
            if (data.offers.length == 0) {
                ac([]);
            }
            for (let i in data.offers) {
                let tmpOffer = {};
                let adv_offer = data.offers[i];
                if (adv_offer.intent != 0) {
                    continue;
                }
                tmpOffer.payout = adv_offer.payout_amount;
                if (tmpOffer.payout < 0.08) {                  
                    continue;
                }
                if (adv_offer.acquisition_flow !='CPI') {
                	continue;
                }
                tmpOffer.adv_offer_id = adv_offer.camp_id;
                tmpOffer.package_name = adv_offer.mobile_app_id;
                tmpOffer.daily_cap=adv_offer.daily_cap;
               // tmpOffer.kpi = adv_offer.kpi;
                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                let num=Math.floor(Math.random()*8);
                tmpOffer.adv_url = adv_offer.click_url + '&aff_sub={clickid}&aff_site_id='+apk_list[num]+'-{networkid}&adv_id={gaid}{idfa}';
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.countries;
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            console.log('error'+page);
            nlog.error(e);
            ac([]);
        }
    });
    
}