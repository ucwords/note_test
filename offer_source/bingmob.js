const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const user = {
    "user":"karen@leanmobi.com",
    "passwd":"3c75f8d9ec3c457bb3113885fbac012b"
};

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('bingmob');
            let maxpage = 3;
            let offers=[];
            let p_offers=[];
            for(let j=1;j <= maxpage;j++){
                p_offers.push(getPage(j)) ;
            }
            //里面有多个await Promise.all写法让其同时触发 节约时间
            let new_offers = await Promise.all(p_offers); //await 表示紧跟在后面的表达式需要等待结果 await命令后面，可以是 Promise 对象和原始类型的值（数值、字符串和布尔值，但这时等同于同步操作
            for(let k in new_offers){
                offers.push.apply(offers, new_offers[k]); //合并
            }
            ac(offers);
        }catch (e) {
            rj(e);
        }

    });
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
        try {
            let op = {
                method: 'GET',
                uri: 'https://bingmob.api.offerslook.com/aff/v1/batches/offers?filters[status]=active&type=personal&offset=1&limit=100&contains=description&Offset='+page,
                auth: {
                    'user': user['user'],
                    'pass': user['passwd'],
                    'sendImmediately': true
                },
                headers: {
                    'content-type': 'application/json'
                }
            }
            let data = await rp(op);
      
            data = JSON.parse(data);

            for (let i in data.data.rowset) {

                let tmpOffer = {};
                let adv_offer = data.data.rowset[i];

                if (adv_offer.offer.tracking_link == null) {
                    continue;
                }

                tmpOffer.payout = adv_offer.offer.payout+'';

                let geo = getGeo(adv_offer.offer_geo);

                if ((!geo) || (tmpOffer.payout < 0.08)) {
                    continue;
                }
                tmpOffer.geo = geo.split(',');

                tmpOffer.adv_offer_id = adv_offer.offer.id+'';
                tmpOffer.package_name = fun.getPackageName(adv_offer.offer.preview_url);
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.offer_name = adv_offer.offer.name;
                tmpOffer.daily_cap = getCap(adv_offer.offer_cap);
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }

                tmpOffer.adv_url = adv_offer.offer.tracking_link + '&aff_sub1={clickid}&source_id={network_id}_{sub_id}&google_aid={gaid}&ios_idfa={idfa}';
                tmpOffer.kpi = adv_offer.offer.description;

                offers.push(tmpOffer);
            }
            ac(offers);
        } catch (e) {

            rj(e);
        }
    });

}
function getGeo(data) {
  if (data.target&&data.target[0]) {
    return data.target[0].country_code; 
  }
}

function getCap(data) {
    if (data != null) {
        return data;
    } else {
        return 0;
    }
}
