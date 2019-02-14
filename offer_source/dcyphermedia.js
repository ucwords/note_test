
function getGeo(val){
    if(!val){
        return null;
    }
    let geo = [];
    for(let i in val){
        geo.push(val[i].Code) ;
    }
    return geo;
}


//test();
//
 const rp = require('request-promise-native');
 const nlog = require('../model/nlog');
 const fun = require('../model/functions');

function getOffer() {
    return new Promise(async (ac, rj) => {
        //https://api.dcyphermedia.net/My/Campaigns?clientId=leanmobiapi&secret=ySRdO5qIxpHTOP9sb8u4BaolUFoHaNRq8UbQgKZyUjE&categories=CPI
        let offers = [];
        try {
            let op = {
                headers: {
                    'User-Agent': 'Leanmobi api',
                    'Accept':'application/json'
                },
                uri: 'https://api.dcyphermedia.net/My/Campaigns',
                qs: {
                   clientId:"leanmobiapi",
                   secret:"ySRdO5qIxpHTOP9sb8u4BaolUFoHaNRq8UbQgKZyUjE",
                   includeCampaignDetails:"true",
                   categories:'CPI'
                }
            };
            let data = await rp(op);

            data = JSON.parse(data);
            if (data.length == 0) {
                return ac([]);
            }

            for (let i in data) {
                let tmpOffer = {};
                let adv_offer = data[i];

                tmpOffer.payout = adv_offer.Campaign.Payout;

                let geo = getGeo(adv_offer.Campaign.Countries);

                if ((!geo) || (tmpOffer.payout < 0.08)) {
                    continue;
                }

                tmpOffer.geo = geo;
                tmpOffer.adv_offer_id = adv_offer.Campaign.OfferId+'';
                tmpOffer.package_name = fun.getPackageName(adv_offer.Campaign.PreviewLink);
                if (!tmpOffer.package_name) {
                    continue;
                }
                tmpOffer.offer_name = adv_offer.Campaign.Name;
                tmpOffer.daily_cap = adv_offer.DailyCap;
                if (tmpOffer.package_name.indexOf(".") > 0) {
                    tmpOffer.platform = 'android';
                } else {
                    tmpOffer.platform = 'ios';
                    tmpOffer.package_name = tmpOffer.package_name.replace('id', '');
                }
                tmpOffer.adv_url = adv_offer.Campaign.TrackingLink + '&sub1={clickid}&sub2={network_id}_{sub_id}&sub3={gaid}{idfa}';
                tmpOffer.kpi = adv_offer.Campaign.Description;

                offers.push(tmpOffer);
            }

            ac(offers);
        } catch (e) {
            ac([]);
        }
});

}

exports.getOffer = getOffer;