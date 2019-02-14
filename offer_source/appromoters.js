const rp = require('request-promise-native');
const nlog = require('../model/nlog');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('appromoters');
        let maxpage = 5;
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
            let data = await rp('http://api.appromoters.com/v2/active_offers?publisher_id=1413&publisher_token=HN7iZjWpeBdB3HuRGKT1yQ&creatives=true&limit=100&offset='+((page-1)*100));
            //console.log(data);
           // console.log('http://api.appromoters.com/v2/active_offers?publisher_id=1413&publisher_token=HN7iZjWpeBdB3HuRGKT1yQ&creatives=true&limit=100&offset='+((page-1)*100))
            data = JSON.parse(data);
            if(data.errormessage || !data.activeoffers){
                ac([]);
            }
            if ((data.activeoffers.length == 0) ) {
                ac([]);
            }
            for (let i in data.activeoffers) {
                let tmpOffer = {};
                let adv_offer = data.activeoffers[i];

                if(adv_offer.incent != 'no'){
                    continue;
                }

                tmpOffer.payout = adv_offer.payout+'';
   
                if (adv_offer.price < 0.08) {
                	if(adv_offer.offer_id != 673910){ //测试单子
                		continue;
                	}
                }
                tmpOffer.adv_offer_id = adv_offer.offer_id;
                tmpOffer.package_name = adv_offer.packagename+'';
                tmpOffer.daily_cap = parseInt(adv_offer.daily_cap);
                tmpOffer.min_os_version = adv_offer.minimum_os_version;
                tmpOffer.category = adv_offer.app_category.toUpperCase().replace('&','AND').replace(/ /g,'_');

                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.click_url+'&publisher_data1={clickid}&placement_id={network_id}_{sub_id}&google_aid={gaid}&ios_ifa={idfa}&publisher_data3=';
                //tmpOffer.geo = [];
                tmpOffer.geo = adv_offer.country.join('|').toUpperCase().split('|') ;
                tmpOffer.kpi = getKPI(adv_offer.kpis);
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
        	console.log(e);
            nlog.error(e);
            ac([]);
        }
    });
    
}

function getKPI(kpis){
	let ret = [];
	for(let i in kpis){
		if(kpis[i].type == 'hard'){
			ret.push(kpis[i].description)
		}
	}
	return ret.join(',');
}