let cron = require('node-cron');
const cluster = require('cluster');
let args = process.argv.splice(2) || [];
const config = require('../config/main');
const nlog = require('../model/nlog');
const survey = require('../survey');
const fs = require('fs');
if (args.indexOf('--debug')) {
    config.debug = true;
}
process.on('uncaughtException', function(err) {
    debug('Some uncaught exception happend');
    debug(err);
    nlog.error(err.stack);
});
if(config.debug){
    global.debug = function(){
        console.log(new Date())
        console.log.apply(console,arguments)
    };
}else global.debug = function() {}


global.all_exit = function(code) {
    process.send({ "cmd": "exit", "code": code }, function() {
        console.log('EXIT by worker');
    });
}

if (cluster.isMaster) {
    debug('You are on the debug model.')

    function fock() {
        worker_process = cluster.fork();
        worker_process.on('message', function(msg) {
            if (msg.cmd == 'exit') {
                console.error('PROCESS EXIT WITH CODE ', msg.code);
                process.exit(1);
            }
        })
    }

    let process_num = 1; //目前用一个进程
    cluster.on('listening', function(worker, address) {
        console.log("A worker with #" + worker.id + " is now connected to " +
            (address.address || '*') +
            ":" + address.port);
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died,it will try to restart after 3s');
        setTimeout(function() {
            fock();
        }, 3000);
    });

    for (let i = 0; i < process_num; i++) {
        fock()
    };

    if(!config.no_survey){
        cron.schedule('*/1 * * * *', function() {
            survey.surveyLoop()
        });
    }

} else {
    console.log('Start a worker');
    let main = require('../main.js');
    fs.watch('offer_source/', function(event, filename) {
        process.exit(0)
    });

    fs.watch('config/', function(event, filename) {
        process.exit(0)
    });
    main.start();
    cron.schedule('*/15 * * * *', function() {
        
        main.start();
    });
    
    

}
