const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer= function(){
	let maxpage = 20;
	return new Promise(async (ac,rj)=>{
		let offers=[]
		console.log('emar');
		try{
			let data = await rp('http://cpisvr.emarbox.com/offer?token=45478721fd466a33bbc32e72b0b06bd7&size=2000&page=1');
			//console.log(data);
			data = JSON.parse(data);
			if (data.status != 'ok'){
				ac([]);
			}
			if (data.data.offers.length == 0){
				ac([]);
			}
			for (let i in data.data.offers){
				let tmpOffer = {};
				let adv_offer = data.data.offers[i];
			 	
				tmpOffer.payout = adv_offer.payout;
				if (tmpOffer.payout<0.08){
					continue;
				}
				tmpOffer.adv_offer_id = adv_offer.id;
				tmpOffer.package_name = adv_offer.packageName;
				if (!tmpOffer.package_name){
					continue;
				}
				if (tmpOffer.package_name.indexOf(".") > 0) {
					tmpOffer.platform = 'android';
				}else{
					tmpOffer.platform = 'ios';
					tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
				}
				tmpOffer.adv_url = adv_offer.clickUrl +'&extraInfo1={clickid}&idfa={idfa}&gaid={gaid}&sub={networkid}'
				tmpOffer.kpi = adv_offer.kpi;
				//tmpOffer.geo = [];
				tmpOffer.geo = adv_offer.geo2b.split(',');
				offers.push(tmpOffer);
			}

			ac(offers);
		}catch(e){
			
			rj(e);
		}

	});
}

//test();