const centerDb = require('./common/center_db');
let source = require('./offer_source');
const nlog = require('./model/nlog');
const fs = require('fs');
const crypto = require('crypto')
const path = require('path')
const loadpackage = require('./model/loadpackage')
const rp = require('request-promise-native');
const conf = require('./config/main');
let checkValue = require('./model/checkVal').checkValue;
debug = global.debug || console.log
let arg = process.argv.splice(2);
let md5 = function(str){
    return crypto.createHash("md5").update(str).digest('hex').substring(7,23);
}
if(arg.length >0){
    console.log(arg);
}
exports.start = async function () {
    
    await centerDb.init();
    sourceGet();

}

async function sourceGet() {
    let timestamp = new Date().getTime();
    let offer_source = await source.getSource();

    //return;
    let pm_list = [];
    for(let adv_id in offer_source){
        adv_id = parseInt(adv_id);
        let timestamp_oneadv = new Date().getTime();
        if(offer_source[adv_id] == 'stop'){
            //已经停掉的广告主把所有的单子都停掉
            console.log('try to stop '+adv_id);
            centerDb.table('i_offer').update({ "adv_id": adv_id, "status": 1 }, { $set: { "status": 0} }, { multi: true });
        }else{
            try {
                pm_list.push(getOffer(offer_source[adv_id],adv_id));
                if(pm_list.length >=8){ //三个并发广告主
                    await Promise.all(pm_list);
                    pm_list=[];
                }
            } catch (e) {
                debug(e);
                nlog.error(e);
            }
            await Promise.all(pm_list);
        }
        console.log(adv_id + '->Finish 耗时 : ' + (((new Date().getTime()) - timestamp_oneadv) / 1000) + '秒');
    }
    console.log('全部结束,耗时 : ' + (((new Date().getTime()) - timestamp) / 1000) + '秒');
}
let weight=12;
function getOffer(script){
    let adv_id = script.adv_id;
    let adv_name = script.adv_name
    let now = Date.parse(new Date()) / 1000;
    return new Promise(async function(ac,rj){
        let offers;
        try{
            offers = await script.getOffer();
            if(offers.length>2000){
                offers = offers.slice(0,2000)
            }
        }catch(errr){
            console.log('#'+ adv_id + adv_name+' has some error');
            console.log(errr);
            ac([]);
        }
        if(offers){
            console.log('#'+ adv_id + adv_name + ':共获得'+offers.length+'条Offers');
        }else{
            return console.log('#'+ adv_id + adv_name + ':无数据');
        }
        
        promise_list = [];
        for (let k in offers) {
            let offer = offers[k];
            if(typeof offer != 'object'){
                continue;
            }
            offer.adv_id = parseInt(adv_id);
            if(!checkValue(offer)){
                continue;
            }
            offer.offer_id = md5(offer.adv_offer_id + '|' + adv_id);
            offer.mod=script.type
            let pkg={};
            if(offer.mod =='cpi'){
                offer.kpi = offer.kpi || 'CVR below 3% and 2nd retention rate >10%;Traffic KPI: none Incent,no fraud,no cheating,no adult';
                pkg = await loadpackage.load(offer.package_name,offer.geo[0]);
                if (!pkg) {
                    nlog.error(offer.package_name + '->not found');
                    continue;
                }
                offer.icon = pkg.icon;
                offer.creatives = pkg.screenshot||[];
                if (offer.platform == 'android'){
                    offer.min_os_version = offer.min_os_version || pkg.min_os_version || '4.3';
                }else{
                    offer.min_os_version = offer.min_os_version || pkg.min_os_version || '9.0';
                }
    
            }else{
                pkg={};
                offer.kpi = offer.kpi || 'no fraud,no cheating,no ifream,no robot';
                offer.survey_status = true;//CPA单子不探测直接设置为OK
            }
            if(conf.no_survey){//关闭探测后所有单子设定为探测通过,层数为2,以便让接口可以继续使用
                offer.survey_status = true;
                offer.survey_level=2;
            }
            offer.offer_name = offer.offer_name || pkg.title;
           
            offer.des = offer.des||pkg.des;
            offer.currency = offer.currency ||'USD';
            offer.device = offer.device || ['tablet','phone'];
            offer.network_standard = offer.network_standard||['2g','2.5g','3g','4g','5g','wifi'];
            offer.daily_cap = parseInt(offer.daily_cap);
            offer.update_at = now;
            offer.status = 1;
            offer.payout = offer.payout+''; //保证payout为字符串,防止浮点型过长
            offer.payout_float = parseFloat(offer.payout);
            let private = offer.private||0;//只在添加时候设置private 是为了防止影响人工修改private后变回原形
            delete offer.private;
            if(isNaN(offer.payout_float)){
                continue;
            }
            if(offer.mod == 'cpi'){
                if(  offer.payout_float>15||offer.payout_float<0.08){
                    continue;
                }
            }
            offer.category = pkg.category||offer.category;
            promise_list.push(
                centerDb.table('i_offer').update(
                    { "offer_id": offer.offer_id },
                    {
                        "$set": offer,
                        "$setOnInsert": { "create_at": now, "system_status": 1,"sdk_weight":weight,"survey_time":0,"private":private }
                    },
                    { "upsert": true }
                )
            );
        }
        if(promise_list.length > 0){
            await Promise.all(promise_list);
        }
        //把这个广告主中所有老的单子全部停掉
        centerDb.table('i_offer').update({ "adv_id": adv_id, "update_at": { $lt: now }, "status": 1 }, { $set: { "status": 0, "update_at": now } }, { multi: true });
        ac(true);
    })
    
}
