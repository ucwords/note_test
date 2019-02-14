//用于探测
const rp = require('request-promise-native');
const nlog = require('./nlog');
const user = {
	"user":"karen@leanmobi.com",
	"passwd":"b4740c50a0975ea25a8e2df8428b2149"
}
const mask={
	'gaid':'1EAD30B1-6666-6666-6666-1052D198902D',
	'idfa':'1EAD30B1-6666-6666-6666-ADI0198902D',
	'sub_id':"tester",
	'network_id':'6',
	'clickid':'1234567'
}
/*//{
          'content-type': 'application/json',
          body: JSON.stringify({foo: 'bar', _attachments: {'message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}})
        },*/
//curl -X POST "http://api.linkintest.com/detector/url" -H "Content-Type:application/json"  --user karen@leanmobi.com:eec16b4ef330494e995b2ee3ccb50663  -d '{ "testLink": "http://track.onlytopoffers.in/index.php?offer_id=1255&aff_id=151", "targetLink":"", "platform": "mobile", "os": "android", "version": "", "country": "IN" }'
let go = function (test_url,country,pl,package,offer_id) {
    return new Promise(async (ac, rj) => {
    	if(!test_url){
    		return ac(null);
    	}
    	test_url = (test_url+'').replace('{gaid}{idfa}','{gaid}').replace('{idfa}{gaid}','{idfa}');
    	if(test_url.indexOf('gowadogo.com')>-1){
			//immobi不给设备号 以防止其触发异步跳转
			test_url.replace('{gaid}','').replace('{idfa}','');
		}
    	for(let k in mask){
    		test_url = test_url.replace('{'+k+'}',mask[k]);
    	}
    	
    	let op = {
	    		method: 'POST',
			    uri: 'http://api.linkintest.com/detector/url',
			    auth: {
				    'user': user['user'],
				    'pass': user['passwd'],
				    'sendImmediately': true
				},
			    body: JSON.stringify({
			        "testLink": test_url,
					"platform": "mobile",
					"os": pl,
					"country": country
			    }),
			    headers: {
			        'content-type': 'application/json'
			    }
	    	}
	    	nlog.sur(op.body);
	    try{
	    	let data = await rp(op);
	    	data = JSON.parse(data);
	    	if(data.message == 'success'){
	    		data.data['offer_id'] = offer_id;
	    		data.data['package_name'] = package;
	    		return ac(data.data);
	    	}else{
	    		nlog.sur_error(data.message);
	    		ac(null);
	    	}
	    }catch(e){
	    	nlog.sur_error(e);
	    	ac(null)
	    }
    });
}
exports.go = go;
/*async function test(){
	let data = await go('http://clk.apxadtracking.net/iclk/redirect.php?id=mN8aKW9Ue3jMIWuXmT9HeTGHe3jMIWuXeUeUeW4-0N&trafficsourceid=33321&dv1={clickid}&device_id={gaid}{idfa}&nw_sub_aff={network_id}_{sub_id}','CA','android');
	console.log(data);
}
test()*/