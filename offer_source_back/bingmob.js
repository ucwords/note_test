const rp = require('request-promise-native');
const nlog = require('../model/nlog');

exports.getOffer= function(){
	let maxpage = 20;
	return new Promise(async (ac,rj)=>{
		let offers=[]
		console.log('bingmob');
		try{
			let data = await rp('https://fank%40pentamob.com:1710149520764f3ab303139e21058ccb@bingmob.api.offerslook.com/aff/v1/batches/offers?filters[status]=active&type=personal&offset=1&limit=100');
			//console.log(data);
			data = JSON.parse(data);
			if(data.code != 0){
				rj({'error':1,"msg":'GET DATA ERROR',"data":data});
			}
			if(data.data.rowset.length == 0){
				ac([]);
			}
			for(let i in data.data.rowset){
				let tmpOffer = {};
				let adv_offer = data.data.rowset[i];
			 	if (adv_offer.offer.category.indexOf('CPI')<0){
					continue;
				} 
				tmpOffer.payout = adv_offer.offer.payout;
				if (tmpOffer.payout<0.08){
					continue;
				}
				tmpOffer.adv_offer_id = adv_offer.offer.id;
				tmpOffer.package_name = adv_offer.offer.name;
				if (!tmpOffer.package_name){
					continue;
				}
				if (tmpOffer.package_name.indexOf(".") > 0) {
					tmpOffer.platform = 'android';
				}else{
					tmpOffer.platform = 'ios';
					tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
				}
				tmpOffer.adv_url = adv_offer.offer.tracking_link+'&aff_sub1={clickid}&iso_idfa={idfa}&google_aid={gaid}&source_id={networkid}'
				tmpOffer.kpi = 'No Facebook Traffic;No Redirect Traffic;Own Creatives Not Allowed;Invalid or duplicate leads unaccepted;No Social Networks;No Search;No Brand bidding;No E-Mailings;No Adult Content';
				//tmpOffer.geo = [];
				tmpOffer.geo=[];
				for(let g in adv_offer.offer_geo.target){
					tmpOffer.geo.push(adv_offer.offer_geo.target[g].country_code);
				}
				//console.log(tmpOffer);
				offers.push(tmpOffer);
			}

			ac(offers);
		}catch(e){
			
			rj(e);
		}

	});
}

//test();