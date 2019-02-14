//joffe 流方式日志模块
var fs = require('fs');

var curday = new Date().getDate();
var BUFFER_CHECK_INTERVAL = 1000;//1s
var BUFFER_FLUSH_LEN = 2048;
var LOG_DIRECTORY = "logs/";

//检查目录
if(!fs.existsSync(LOG_DIRECTORY)){
    fs.mkdirSync(LOG_DIRECTORY) ;
}
if(!fs.existsSync(LOG_DIRECTORY+'error')){
    fs.mkdirSync(LOG_DIRECTORY+'error') ;
}
if(!fs.existsSync(LOG_DIRECTORY+'sur')){
    fs.mkdirSync(LOG_DIRECTORY+'sur') ;
}
if(!fs.existsSync(LOG_DIRECTORY+'sur_error')){
    fs.mkdirSync(LOG_DIRECTORY+'sur_error') ;
}

if (!fs.existsSync(LOG_DIRECTORY + 'wrong_carriers')) {
    fs.mkdirSync(LOG_DIRECTORY + 'wrong_carriers');
}

//时间的方法
function getTime(dnow) {
    return ('0'+dnow.getHours()).substr(-2) + ':' + ('0'+dnow.getMinutes()).substr(-2) + ':' + ('0'+dnow.getSeconds()).substr(-2);
}
function getHours(dnow) {
    return ('0'+dnow.getHours()).substr(-2);
}
function getDate(dnow){
    return ('0'+(dnow.getMonth()+1)).substr(-2)+'-'+('0'+dnow.getDate()).substr(-2);
}

function getYear(dnow){
    return dnow.getFullYear();
}
//console.log(getTime());
function getQuarter(dnow){
    //15分钟为一刻,现在是15分钟为一个文件
    return ('0'+dnow.getHours()).substr(-2) + '_' + Math.floor((dnow.getMinutes()+15)/15);
}

//logFile 类.用流来写入log 更高效,避免爆仓
//http://segmentfault.com/blog/chshouyu/1190000000519006
function LogFile(path){
    this.buffers = [];
    this.bufferCheckInterval = BUFFER_CHECK_INTERVAL;
    this.init(path);
}

LogFile.prototype.init = function(path) {
    var self = this;
    this.path = path;
    this.stream = fs.createWriteStream(path, {
        flags : 'a' //全部权限,读写
    });

    this.bufferCheckTimer = setInterval(function() {
        self._flush(); //定时保存
    }, this.bufferCheckInterval);

};

LogFile.prototype.destroy = function() {
    this._flush();

    if (this.bufferCheckTimer) {
        clearInterval(this.bufferCheckTimer);
        this.bufferCheckTimer = null;
    }
    if (this.stream) {
        this.stream.end();
        this.stream.destroySoon();
        this.stream = null;
    }
};

LogFile.prototype.restart = function(path) {
    this.destroy();
    this.init(path);
};

LogFile.prototype.push = function(str) {
    this.buffers.push(str);
    if (this.buffers.length >= BUFFER_FLUSH_LEN) {
        this._flush();
    }
};

LogFile.prototype._flush = function() {
    if (this.buffers.length > 0 && this.stream) {
        this.buffers.push('');
        var str = this.buffers.join('\n');
        this.stream.write(str);
        this.buffers = [];
    }
};

var logMap={};
function push2File(str,type,path) {
    if(!logMap[type]){
        logMap[type] = new LogFile(path);
    }
    if(logMap[type]['path'] !=path){
        logMap[type].restart(path);
    }
   logMap[type].push(str);
}


function format(str,dnow,not_need_time){
    if(not_need_time){
        return str+''.replace(/[\r\n]/g,"##");
    }else{
         return getYear(dnow)+'-'+getDate(dnow)+' '+ getTime(dnow)+'\t' + str.replace(/[\r\n]/g,"##");
    }
    
}

exports.error = function(str) {
    if(typeof(str)=='object'){
        if(str.stack){
            str = str.stack;
        }
    }
    var dnow=new Date();
    var file = LOG_DIRECTORY+'error/'+getYear(dnow)+'-'+getDate(dnow)+'.error.log';
    str = format(str,dnow);
    push2File(str, 'error',file);
};

exports.sur = function(str) {
    var dnow=new Date();
    var file = LOG_DIRECTORY+'sur/'+getYear(dnow)+'-'+getDate(dnow)+'.sur.log';
    str = format(str,dnow);
    push2File(str, 'sur',file);
};

exports.sur_error = function(str) {
    if(typeof(str)=='object'){
        if(str.stack){
            str = str.stack;
        }
    }
    var dnow=new Date();
    var file = LOG_DIRECTORY+'sur_error/'+getYear(dnow)+'-'+getDate(dnow)+'.sur_error.log';
    str = format(str,dnow);
    push2File(str, 'sur_error',file);
};

exports.carr = function (str) {
    if (typeof (str) == 'object') {
        if (str.stack) {
            str = str.stack;
        }
    }
    var dnow = new Date();
    var file = LOG_DIRECTORY + 'wrong_carriers/' + getYear(dnow) + '-' + getDate(dnow) + '.wrong_carriers.log';
    str = format(str, dnow);
    push2File(str, 'wrong_carriers', file);
};