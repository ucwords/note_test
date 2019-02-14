let http = require('http');
let url = ''; //adv info get

let getSource=function(){

	return new Promise(function(re,rj) {
		http.get(url, function (rs) {
			var data = '';
			rs.on('data', function (chunk) {
				data += chunk.toString();
			});
			rs.on('end', function () {
				let dd = JSON.parse(data);
				if(!dd){ 
					rj({"code":"NO_ADV"});
				}
				dd = dd['data'];
				console.log(dd);return
				let src_list = {};
				for(let i in dd){
					console.log(dd[i].name)
					if(dd[i].status == 0 ){
						t='stop';
					}else{
						try {
							t = require('./offer_source/' + dd[i]['name'] + '.js');
							t.type=dd[i].type;
							t.adv_id = dd[i].id;
							t.adv_name=dd[i]['name'];
							console.log(t);
						} catch (e) {
							//console.log(e);
							t = null;
						}
					}
					if(t){
						src_list[dd[i].id] = t;
					}
					
				}
				re(src_list);
			})

		}).on('error', function (e) {
			console.log(url);
			if (e.code != 'HPE_INVALID_CONSTANT') {
				rj(e)
			}

		})
	})
}

//console.log(re);
module.exports.getSource=getSource;
