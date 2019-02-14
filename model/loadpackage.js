const centerDb = require('../common/center_db'); 
const ch = require('cheerio');
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
centerDb.init();
function loadDb(package_name){
	return new Promise(async function(ac,rj){
		let now = Date.parse(new Date()) / 1000;
		let three_month_ago = now - 7776000;//三个月内的包认为有效 三个月后认为失效
		try{
			let data = await centerDb.table('i_package').findOne({ "package_name": package_name });
			if(!data){
				return ac(false);
			}
			if(data.title){
				//找到的应用信息保存3个月
				if (data.update_at < three_month_ago) {
					ac(false);
				} else {
					ac(data);
				}
			}else{
				//不能找到的应用暂时保存5小时,防止频繁访问谷歌导致拖慢速度
				if (data.update_at < now-3600*5){
					ac(false);
				}else{
					ac(data);
				}
			}
			
		}catch(e){
			nlog.error(e);
			ac(false);
		}
	})
}
async function loadGp(package_name,country){
	return new Promise(async function(ac,rj){
		let data = {};
		data.package_name = package_name;
		let url = 'https://play.google.com/store/apps/details?id='+ package_name + '&hl=en';
		//<a itemprop="genre" href="https://play.google.com/store/apps/category/NEWS_AND_MAGAZINES" class="hrTbp R8zArc">News &amp; Magazines</a>
		try { 
			let rs = await rp(url);
			if (rs) {
				let $ =  ch.load(rs);
				data.title = $('h1[itemprop = "name"]').text();
				data.icon = $('img[itemprop="image"]').prop('src');
				data.des = $('[itemprop="description"]').attr('content');
				let cat = $('a[itemprop="genre"]').prop('href');
				let cats = cat.split('/');
				data.category = cats.pop();
				let img = $('[data-screenshot-item-index] img');
				data.screenshot = [];
				try{
					img.each(function(i, elem) {
						data.screenshot[i] = $(this).prop('src');
						if(i == 5){
							return false;
						}

					});
				}catch(er){}
				//console.log(data);
				ac(data);
			} else {
				ac(false);
			}
		} catch (e) {
			nlog.error(e);
			ac({"status":0,"package_name":package_name});
		}
	});
}
function loadIt(package_name,country){
	return new Promise(async function(ac,rj){
		let data = {};
		data.package_name = package_name;
		country = country||'us';
		country = (country+'').toLowerCase();
		if(country == 'all'){
			country = 'us';
		}
		let url = 'https://itunes.apple.com/'+country+'/lookup?id=' + package_name;
		try{
			let rs = await rp(url);
			if(rs){
				rs = JSON.parse(rs);
				let info = rs.results[0];
				if(!info){
					return ac(false);
				}
				data.title = info.trackCensoredName;
				data.icon = info.artworkUrl100;
				data.des=info.description;
				data.category=info.primaryGenreName;
				if (info.screenshotUrls && info.screenshotUrls.length){
					data.screenshot = info.screenshotUrls.slice(0, 6);
				}
				ac(data);
			}else{
				ac(false);
			}
		}catch(e){
			nlog.error(e);
			ac({"status":0,"package_name":package_name});
		}
	});
}

function storePackage(data){
	let now = Date.parse(new Date()) / 1000;
	if(!data.update_at){
		data.update_at = now;
	}
	data.hasUrl = false;
	centerDb.table('i_package').update(
		{ "package_name": data.package_name },
		{
			"$set": data,
			"$setOnInsert": { "create_at": now, "system_status": 1 }
		},
		{ "upsert": true }
	)
}


exports.load = function(package_name,country){
	//console.log(package_name);
	return new Promise(async function(ac,rj){
		
		let data;
		data = await loadDb(package_name); 
		if(data){
			if(data.title){
				ac(data);
			}else{
				ac(null);
			}
			
		}else{
			if(package_name.indexOf(".") > 0){
				data = await loadGp(package_name,country);
			
			}else{
				data = await loadIt(package_name,country);
			}
			if (data) {
				storePackage(data);
				
			}
		}
		
		ac(data);
	});
}