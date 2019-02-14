const survey_model = require('./model/survey');
const centerDb = require('./common/center_db');
const nlog = require('./model/nlog');
async function surveyLoop(){
	console.log('survey start');
	await centerDb.init();
  	let now = Date.parse(new Date()) / 1000;
    let p = [];
    let offers = await getOffers();
    if(!offers){
    	return;
    }
    let n=0,m=0;
    for(let i in offers){
        n++;
       // nlog.sur(offers[i].adv_url);//在发出前记录
    	p.push(survey_model.go(offers[i].adv_url,offers[i].geo[0],offers[i].platform,offers[i].package_name,offers[i].offer_id));
        if(n%10 === 0){
            await pause(1000);//每隔10个停顿一秒,防止接口处理不过来
        }
    }
   // console.log(1111);
    let data = await Promise.all(p);
    for(let k in data){
    	//console.log(data[k]);
    	let dd = data[k];
    	if(!dd){
    		continue;
    	}
        
        m++;
    	dd.update_at = now;
    	if(dd.trackStatus){
    		let prew_link = dd.redirectUrl[dd.redirectUrl.length -1];
    		if(prew_link.indexOf(dd.package_name) == -1){
    			dd.trackStatus = false;
    		}
    	}
    	centerDb.table('i_survey').update(
            { "offer_id": dd.offer_id },
            {
                "$set": dd,
                "$setOnInsert": { "create_at": now }
            },
            { "upsert": true }
        );
        

        centerDb.table('i_offer').update(
        	{"offer_id":dd.offer_id},
        	{
        		$set:{
        			"survey_time":now,
        			"survey_level":dd.redirectLevel,
        			"survey_status":dd.trackStatus
        		}
        	}
        );

    }
    console.log('finish'+n);

}

function getOffers(){
	let limit = 100;
	let now = Date.parse(new Date()) / 1000;
    let survey_ttl = now - (3600*12);//探测结果保留12小时
	return new Promise(function(ac,rj){
		let offers = centerDb.table('i_offer')
    	.find({"survey_time":{"$lt":survey_ttl},"status":1,"system_status":1,"mod":"cpi","manually":null},{ offer_id: 1, adv_url: 1 ,package_name:1,platform:1,geo:1}).limit(limit)
    	.sort({"survey_time":1,"create_at":1})
        .toArray(function(err, items){
    		if(err){
    			nlog.sur_error(err);
    			return ac(null);
    		}
    		ac(items);
    	});
	});
}

exports.surveyLoop = surveyLoop;

function pause(time){
    return new Promise(function(ac,rj){
        setTimeout(function(){
            ac(null);
        },time)
    });
}

/*db.i_offer.update(
    {"survey_time" : {$exists : false}},
    {"$set" : {"survey_time" : 0}},
    false,
    true
)*/