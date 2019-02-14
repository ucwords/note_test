
const nlog = require('../nlog');
let data = require('./carr.data.json');
//根据国家和名字获取carrier
function trim(x) {
	return x.replace(/^\s+|\s+$/gm, '');
}
function getCarrier(country,carrier_name,no_return_all_country){
	if(!data[country]){
		return [];
	}
	if (!carrier_name && (no_return_all_country==false)){
		return getCarrierByCountry(country);
	}
	let carrier = carrier_name.toLowerCase().split(' ');
	if(carrier[0] == 'h3g'){//别称
		carrier[0] = '3';
	}else if(carrier[0] == 'china'){
		carrier = carrier[1];
	}else{
		carrier = trim(carrier[0]);
	}
	
	if(!data[country][carrier]){
		nlog.carr(country + '-' + carrier);
		if(no_return_all_country){
			return null;
		}else{
			return getCarrierByCountry(country);
		}
	}else{
		return data[country][carrier];
	}

}
//根据国家获取carrier
function getCarrierByCountry(country){
	let carriers = data[country];
	if(!data[country]){
		return [];
	}else{
		let re=[];
		for(let i in data[country]){
			for(let j in data[country][i]){
				re.push(data[country][i][j]);
			}
		}
		return re;
	}
}
function trim(str)
 { 
  return str.replace(/(^\s*)|(\s*$)/g, ""); 
}
function search(countries,carriers){
	let re=[];
	let map = {};//用于排重
	let tmp=[];
	for(let i in countries){
		for(let j in carriers){
			if(countries[i] !=='--'){
				tmp = getCarrier(trim(countries[i]), trim(carriers[j]),true)
				if(tmp){
					for(let k in tmp){
						if(map[tmp[k].id]){
							continue;
						}
						map[tmp[k].id] = true;
						re.push(tmp[k]);
					}
				}
			}
		}
	}
	return re;
}
exports.search=search;
exports.getCarrier = getCarrier;
exports.getCarrierByCountry = getCarrierByCountry;
exports.getCarrierBycountrys=function(countries){
	let re=[];
	for(let i in countries){
		let carriers = data[countries[i]];
		if (!carriers){
			continue;
		}
		for(let j in cariers){
			re.push(carries[j]);
		}
	}
	return re;
}
