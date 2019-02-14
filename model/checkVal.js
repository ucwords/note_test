function err(offer,key,msg){
	let adv;
	if(offer){
		adv = offer.adv_id;
	}
	console.log('--------------警告-----------------');
	console.log('检测出['+adv+']出现数据不及格问题');
	console.log('ADV Offer ID:'+offer.adv_offer_id);
	console.log('问题字段['+key+']');
	console.log('字段数据如下:');
	console.log(offer[key]);
	if(msg){console.log(msg);}//附加消息
	console.log('-----------------------------------');
}
const valueType={
	adv_offer_id:{"must":1,"type":"any"}
	,offer_name:{"must":0,"type":"string"}
	,des:{"must":0,"type":"string"}
	,currency:{"must":0,"type":function(d){
		return ['USD','CNY','EUR','GBP'].indexOf(d+'')>-1
	}}
	,package_name:{"must":0,"type":"string"}
	,daily_cap :{"must":0,"type":"int"}
	,payout:{"must":1,"type":"numberc"}
	,category:{"must":0,"type":"string"}
	,kpi:{"must":0,"type":"string"}
	,geo:{"must":1,"type":function(d){
		if (typeof(d) == 'object' &&  !isNaN(d.length)) {
			for(let i in d){
				if(typeof(d[i]) != 'string' || (d[i].length !=2 && d[i] != 'ALL')){
					return false;
				}
			}
			return true;
		}else{
			return false;
		}
	}}
}

function checkValue(d){
	if(typeof(d) != 'object'){
		err({},key,'整个offer都有问题,offer非对象');
		return false;
	}
	for(let key in valueType){
		let v = valueType[key];
		let dd=d[key];
		if(v.must ){
			if(dd === null || dd === undefined || dd === ''){
				err(d,key);
				return false;
			}
		}else if(dd){
			if(typeof(v.type)=='string'){
				if(v.type == 'string' || v.type == 'number'){
					let re= (typeof(dd) == v.type);
					if(!re){
						 err(d, key)
						 return false
					}

				}else if(v.type == 'int'){
					if (parseInt(dd) != dd){
						err(d, key)
						return false
					}
				}else if(v.type == 'numberc'){
					if(dd === null || dd === undefined){
						err(d, key)
						return false;
					}
					if(parseFloat(dd) != dd){
						err(d, key)
						return false;
					}
				}

			}else{
				if(!v.type(dd)){
					err(d,key);
					return false;
				};
			}
		}
	}
	return true;
}

exports.checkValue = checkValue;