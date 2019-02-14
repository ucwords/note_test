const rp = require('request-promise-native');
const nlog = require('../model/nlog');
const fun = require('../model/functions');
const secretKey = '37e50b8aae1e4595b4f844e18bba4a79';
let session={};
exports.getOffer = function(){
    return new Promise(async function(ac,rj){
        console.log('inmobi');
        let sessionInfo = await getSession();
        if(sessionInfo.error){
            console.log('login error');
            return ac([]);
        }
        session = sessionInfo.respList[0];

        let maxpage = 1;
        let offers=[];
        let p_offers=[];
        for(let j=1;j <= maxpage;j++){
            p_offers.push(getPage(j)) ;
        }
        let new_offers = await Promise.all(p_offers);
        for(let k in new_offers){
            offers.push.apply(offers, new_offers[k]);
        }
        ac(offers);
    });
}

function getSession(){
    return new Promise(async(ac,rj)=>{
        var options = {
            uri: 'https://api.inmobi.com/v1.0/generatesession/generate',
            
            headers: {
                'User-Agent': 'Leanmobi offer async v1.0',
                userName : 'fanny@leanmobi.com',
                secretKey : secretKey
            },
            json: true // Automatically parses the JSON string in the response
        };
        let data;
        try{
            data = await rp(options);
        }catch(e){
            nlog.error(e);
            return rj(e);
        }
       
        ac(data);
    })
    
}

function getPage(page) {
    return new Promise(async (ac, rj) => {
        let offers = [];
        let apikey='';
        try{
            let opt = {
                url:'https://api.inmobi.com/iap/v0/json',
                qs: {
                   api_key:'5c795bfd-64eb-43ab-83a0-75ad789ab605',
                   target:'affiliate_offer',
                   method:'findMyApprovedOffers',
                   page:page
                },
                headers: {
                    'User-Agent': 'Request-Promise',
                    'accountId': session.accountId,
                    'sessionId': session.sessionId,
                    'SecretKey': secretKey
                },

                json: true
            }

            let data = await rp(opt);
            //console.log(data);
           //return;
           // console.log('http://api.appromoters.com/v2/active_offers?publisher_id=1413&publisher_token=HN7iZjWpeBdB3HuRGKT1yQ&creatives=true&limit=100&offset='+((page-1)*100))
            //data = JSON.parse(data);
            //console.log(data)
            data = data.response;
            if (data.status != 1) {
                return ac([]);
            };
            for (let i in data.data.data) {
                let tmpOffer = {};
                let adv_offer = data.data.data[i];
               // console.log(adv_offer);
               // return;
                if(adv_offer.Offer.currency != 'USD'){
                    continue;
                }

                tmpOffer.payout = adv_offer.Offer.default_payout+'';

                if (adv_offer.price < 0.08) {
                	
                	continue;
                	
                }
                tmpOffer.adv_offer_id = adv_offer.Offer.id;
                tmpOffer.package_name = fun.getPackageName(adv_offer.Offer.preview_url);
                tmpOffer.daily_cap = parseInt(adv_offer.Offer.conversion_cap);
                //tmpOffer.min_os_version = adv_offer.minimum_os_version;
                tmpOffer.category = adv_offer.Offer.category_name;

                if (!tmpOffer.package_name) {
                    continue;
                }
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id','');
                }
                
                tmpOffer.adv_url = adv_offer.Offer.click_url+'&aff_sub={clickid}&aff_sub2={network_id}-{sub_id}&google_aid={gaid}&ios_ifa={idfa}';
                //tmpOffer.geo = [];
                tmpOffer.geo = getCountry(adv_offer.Country)
                //tmpOffer.kpi = getKPI(adv_offer.kpis);
                tmpOffer.kpi=adv_offer.Offer.description;
                tmpOffer.survey_status = true;
                tmpOffer.survey_level = 1;
                tmpOffer.manually = 0;//停用探测,当为1时候表示为手动上的单子,只要不为null就不探测
            //    console.log(tmpOffer.kpi);
                offers.push(tmpOffer);
            }

            ac(offers);
        } catch(e) {
        	console.log(e);
            nlog.error(e);
            ac([]);
        }
    });
    
}

function getCountry(countris){
    let country=[]
    for(let cc in countris){
        country.push(cc);
    }
    return country;
}