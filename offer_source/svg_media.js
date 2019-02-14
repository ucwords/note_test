const rp = require('request-promise-native');

exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('svg_media');
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
        let data = await rp('http://api.svg.performancecentral.mobi/www/api/v3/API.php?requestParams={"ads":[{"adViewId":"2632","size":"1000","startIndex":"0"}],"apiVersion":"6","deviceLanguage":"en","hashCode":"QEfsvwoVDwfmC0VCU8H5OElETRfv6jlNTEUVSAhASfS6OD1FSDu9tw4PEAk%3D","isMobile":"true","requestSource":"PUBLIC","currencyCode":"USD","directImageUrl":"1"}');
        //console.log(data);return;
        data = JSON.parse(data);

        if (data.success != true) {
           return ac([]);
        }
        if (data.updatelist.length == 0) {
            return ac([]);
        }


        for (let i in data.updatelist) {

            let tmpOffer = {};
            let adv_offer = data.updatelist[i];

            if (adv_offer.targeturl == null) {
                continue;
            }
            tmpOffer.payout = getPrice(adv_offer.pricing);

            let geo = adv_offer.geoInc;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.campaignid+'';
            tmpOffer.package_name = adv_offer.packagename;
            if (!tmpOffer.package_name) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.campaignname;
            tmpOffer.daily_cap = getCap(adv_offer.dailyGoal);
            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.targeturl.replace('subid1=', 'subid1={clickid}').replace('subid2=', 'subid2={network_id}_{sub_id}').replace('gaid=', 'gaid={gaid}').replace('IDFA=', 'IDFA={idfa}');
            tmpOffer.kpi = adv_offer.description;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
    });
    
}
function getPrice(val){
    try{
        return val.replace('USD ', '');
    }catch(e){
        return 0;
    }
}

function getCap(data){
    if (data == null) {
        return 0;
    }
    return data;
}