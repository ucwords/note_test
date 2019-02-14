#!/usr/local/mongo/bin/mongo
/*使用方法:
chmod 755 mongo_index.mongo.js
./mongo_index.mongo.js
*/
var db = db.getSiblingDB("center");
db.i_offer.ensureIndex({"adv_id":1,"adv_offer_id":1});
db.i_offer.ensureIndex({'platform':1,"status":1,"create_at":1});
db.i_offer.ensureIndex({'package_name':1,"stauts":1,"create_at":1});
db.i_offer.ensureIndex({'package_name':1,"stauts":1,"create_at":1});
db.i_offer.ensureIndex({'offer_id':1},{unique:1});
db.i_offer.ensureIndex({"update_at":1});
db.i_package.ensureIndex({"package_name":1},{unique:1});
db.i_survey.ensureIndex({"offer_id":1},{unique:1});
