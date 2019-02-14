const adv_id=500;
const adv_name = 'appsnt';
const adv_type = 'api';
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
let test;
let map={
	"adv_offer_id":"camp_id",
	"package_name":"package_name",
	"offer_name":"title",
	"payout":"payout",
	"platform":"platform",
	"des":"description",
	"mod":"pricing_model",
	"min_os_version":"min_os_version",
	"icon":"icon",
	"geo":"geo",
	"category":"category",
	"adv_url":"click_url",
	"device":"device",
	"kpi":"kpi",


};
exports.adv_id = adv_id;
exports.getOffer = test = function(){
	
	return new Promise(async (ac,rj)=>{
		let offers=[]
		//console.log('test');
		try{
			let data = await rp('http://api.appsnt.com/res.php?cid=9923&token=jOArvva3P3rulbJ7');
			console.log(data);
			console.log('appsnt data reived');
			debug('appsnt data recived');
			data = JSON.parse(data);
			if(data.error != 'false'){
				return rj('get data false');
			}
			data = data.ads;
			for(let k in data){
				let offer={"adv_id":adv_id,"adv_name":adv_name,"adv_type":adv_type};
				let offer_src = data[k];
				for(let our_key in map){
					ther_key = map[our_key];
					if(ther_key != ''){
						offer[our_key] = offer_src[ther_key];
					}
				}
				
				offer.adv_url = offer.adv_url+'&aff_sub={click_id}&sub_channel={network_id}-{sub_channel}&gaid={gaid}&idfa={idfa}&aff_sub2={addon}';
				offer.network_standard = (offer_src.connection_type || '').split(',');
				offer.currency = 'USD';
				try{
				offer.des = (offer.des||'').replace( /(<([^>]+)>)/ig,"").substring(0,512)
				}catch(e){
					offer.des = '';
				}
				if(!offer.geo){
					continue;
				}
				offer.geo = offer.geo.split(',');
				if(offer.adv_offer_id)
					offers.push(offer);
				//debug(offer);
			}
			ac(offers);
		}catch(e){
			
			rj(e);
		}

	})
}

//test();