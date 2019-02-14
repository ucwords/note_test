var crypto = require('crypto');

/**
 * sha1加密
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
function sha1(str) {
    if (!str) {
        return '';
    }
    return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

//从1970年开始的毫秒数然后截取10位变成 从1970年开始的秒数
function timest() {
    var tmp = Date.parse( new Date() ).toString();
    tmp = tmp.substr(0,10);
    return tmp;
}

const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
exports.getOffer = function(){
    return new Promise(async function(ac,rj){  //resolve, reject  async表示函数里有异步操作
        try{
            console.log('mobifun');
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
        let nowtime = timest();

        let signature = sha1('4d976eadc3eca3d7c31b38d81a40b0b6'+nowtime);

        let data = await rp('https://pubapi.mobifunadx.com/apis?key=327b3ca95f9091ee2df8f149a5dddef1&&params={"type":"CPI"}&signature='+ signature +'&ts=' +nowtime);
        //console.log(data);
        data = JSON.parse(data);

        if (data.success != true) {
           return ac([]);
        }
        if (data.data.offers.length == 0) {
            return ac([]);
        }


        for (let i in data.data.offers) {

            let tmpOffer = {};
            let adv_offer = data.data.offers[i];
            //console.log(adv_offer);return;
            if (adv_offer.url == null) {
                continue;
            }
            tmpOffer.payout = adv_offer.payout+'';

            let geo = adv_offer.country;

            if ((!geo) || (tmpOffer.payout < 0.08)) {
                continue;
            }
            tmpOffer.geo = geo.split(',');

            tmpOffer.adv_offer_id = adv_offer.campaign_id+'';
            tmpOffer.package_name = fun.getPackageName(adv_offer.preview_link);
            if (!tmpOffer.package_name && (typeof(package_name) != 'string')) {
                continue;
            }
            tmpOffer.offer_name = adv_offer.offer_name;
            tmpOffer.daily_cap = getCap(adv_offer.daily_budget);

            if (tmpOffer.package_name.indexOf(".") > 0) {
                tmpOffer.platform = 'android';
            } else {
                tmpOffer.platform = 'ios';
                if (tmpOffer.package_name.indexOf("id") > 0) {
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
               // tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
            }

            tmpOffer.adv_url = adv_offer.url + '?aff_sub={clickid}&sub_pub={network_id}_{sub_id}&device_id='+dealPlatform(tmpOffer.platform);
            tmpOffer.kpi = adv_offer.offer_description;

            offers.push(tmpOffer);
        }
        ac(offers);
    } catch (e) {

        rj(e);
    }
    });
    
}

function getCap(data) {
    if (data != null) {
        return data;
    } else {
        return 0;
    }
}

function dealPlatform(platform)
{
    if (platform == 'android') {
        return '{idfa}';
    } else {
        return '{gaid}';
    }
}