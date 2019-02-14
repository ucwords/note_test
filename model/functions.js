exports.getObjVal=function(obj,key){
	keys = key.split('/');
	if(keys.length == 1){
		return obj[key];
	}else{
		let tmp = obj;
		for(let i in keys){
			tmp=tmp[keys[i]];
		}
		return tmp;
	}
}
exports.getPackageName = function(pre_link){
	let url = require('url');
	let pre_info = url.parse(pre_link,true);
	try{
		if(pre_info.host == 'play.google.com'){
			return pre_info.query.id;
		}else if (pre_info.host == 'itunes.apple.com') {
			let itune_info = pre_info.pathname.split('/id');
			//console.log(parseInt(itune_info[1])+'');
			return parseInt(itune_info[1])+'';

		}else{
			return '';
		}
	}catch(e){
		return '';
	}
}