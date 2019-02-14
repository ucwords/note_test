function getPrice(val){
  try{
    return val[0].Payout;
  }catch(e){
    return 0;
  }
}


function getCap(val) {
    try{
        return val[0].Daily_cap;
    } catch(e) {
        return 0;
    }
}

//test();
//
const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('mobupps');
            let maxpage = 1;
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
        let data = await rp('https://api.hasoffers.com/Apiv3/json?NetworkId=wmadv&Target=Affiliate_Offer&Method=findAll&api_key=329690066664b06fa7f15948ae0c6b8744815838fb1d4e377fae8e8f285d4ca9&filters[status]=active&limit=1000&contain[]=TrackingLink&contain[]=Country');
        //console.log(data);
        data = JSON.parse(data);

        if (data.response.httpStatus != 200) {
           return ac([]);
        }
        if (data.response.data.length == 0) {
            return ac([]);
        }

        for (let i in data.response.data.data) {

            let tmpOffer = {};
            let adv_offer = data.response.data.data[i];

            if (adv_offer.TrackingLink == null) {
                continue;
            }
            if(adv_offer.Offer.currency != null) {
                continue;
            }
            if(Object.keys(adv_offer.Country) == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.Offer.default_payout;

            let geo = Object.keys(adv_offer.Country);

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo;

            tmpOffer.adv_offer_id = adv_offer.Offer.id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.Offer.preview_url);
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.Offer.name;
            tmpOffer.daily_cap = 0;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = (tmpOffer.package_name+'').replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.TrackingLink.click_url + '&aff_sub={clickid}&source={network_id}_{sub_id}&ios_ifa={idfa}&google_aid={android}';
            tmpOffer.kpi = adv_offer.Offer.description;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
    });
    
}