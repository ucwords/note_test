//require('');
let checkValue = require('./model/checkVal').checkValue;
let argv= process.argv.splice(2);
if(!argv[0]){
	console.log('useage: node test.js channel_name');
	process.exit(0);
}
console.log('./offer_source/'+argv[0]+'.js');
let testfile = require('./offer_source/'+argv[0]+'.js');
console.log(testfile);
let adv = argv[0];


async function test(){

	let offers  = await testfile.getOffer();
	//console.log(''offers);
	let pass=[];
	for(let i in offers){
		if(checkValue(offers[i])){
			pass.push(offers[i]);
		}
	}
	console.log('Total Offers' + offers.length + ' , Pass Offers:' + pass.length);
	console.log(pass);
	process.exit();
}
test();