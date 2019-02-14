const rp = require('request-promise-native');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('shengmu');
            let maxpage = 2;
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
        let data;
        if (page === 1) {
             data = await rp('http://api.mightapp.com/server/v1/s2s?platform=android&accesstoken=eaf4f24b-e3f3-11e8-8518-06a1fd0cc162'); //安卓
        } else {
             data = await rp('http://api.mightapp.com/server/v1/s2s?platform=ios&accesstoken=f70d7e36-e3f3-11e8-8518-06a1fd0cc162'); //ios
        }

        data = JSON.parse(data);
        if (data.offers == 0) {
            return ac([]);
        }

        for (let i in data.offers) {

            let tmpOffer = {};
            let adv_offer = data.offers[i];

            if (adv_offer.tracklink == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.price;

            let geo = adv_offer.country;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.campaignId+'';
            tmpOffer.package_name = adv_offer.package;
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.name;
            tmpOffer.daily_cap = 0;
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.tracklink + '&sub={clickid}&pubsub={network_id}_{sub_id}&idfa={idfa}&gaid={gaid}';

            tmpOffer.kpi = '';

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
});

}
