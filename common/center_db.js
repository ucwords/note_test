let mongo = require('mongodb').MongoClient
const mongo_config = require('../config/mongo').center;
const nlog = require('../model/nlog');
let db;
let debug = global.debug||console.log;

function connect(config){
	mongo.connect(config.connectStr,config.options).then(
		function(pool){
			debug ('Connect center : '+config.connectStr+'->success');
			db = pool;
		}
	).catch(function(err){
		debug ('Connect center : '+config.connectStr+'->false');
		nlog.error(err);
		process.exit(1);
	});
}
exports.init = function(){
	return new Promise(function(ac,rj){
		if (db)
			ac(true);
		let config = mongo_config
		mongo.connect(config.connectStr, config.options).then(
			function (pool) {
				debug('Connect center : ' + config.connectStr + '->success');
				db = pool;
				ac(true);
			}
		).catch(function (err) {
			debug('Connect center : ' + config.connectStr + '->false');
			nlog.error(err);
			process.exit(1);
		});
	});
	
}
exports.getDb = function(){
	if(db){
		return db;
	}
}
exports.table= function(table){
	if(db){
		return db.collection(table||'test');
	}
}
exports.reconnect= function(){
	connect(mongo_config);
}