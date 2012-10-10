
var walker = require("walkdo");
var queue_do = require("queuedo");
var underscore = require("underscore");

var fs = require("fs");

var requireReg = new RegExp("require\\([\"']([^./]*?)[\"']\\)","g");
var nameReg = /name\s*:\s*'(.*)'/;
var versionReg = /version\s*:\s*'(.*)'/;

//系统模块，take from http://nodejs.org/api/index.json
var sysList = [ "synopsis", "assert", "buffer", "addons", "child_process", "cluster", "crypto", "debugger", "dns", "domain", "events", "fs", "globals", "http", "https", "modules", "net", "os", "path", "process", "punycode", "querystring", "readline", "repl", "stdio", "stream", "string_decoder", "timers", "tls", "tty", "dgram", "url", "util", "vm", "zlib"]
//默认的黑名单
var defaultBlackList = [
"node_modules/*"
];



var dependParser = function(){
    this.depends = {};
    //带有系统模块的依赖列表
    this.requireList = [];
    //最终的依赖列表
    this.dependList = [];
    this.config = {
        blackList : [],
        showError : true
    }
    
   
}
dependParser.prototype = {
    load:function(){
        var self = this;
        if(!fs.existsSync(self.source + "/package.json")){
            this.callback({},new Error("package.json not found! broken!"));
            return;
        }
        var blackList = defaultBlackList.concat(this.config.blackList);
        //加上前缀
        blackList.forEach(function(v,i){
            blackList[i] = (self.source+"/"+v).replace(/\/\//g,"/");
        })
        walker(this.source,function(f,next,context){
            if(/\.js$/.test(f)&&!(new RegExp(blackList.join("|")).test(f))){
                self.parseJsFile(f);
            }
            next.call(context);
        },function(){
            //去重
            self.requireList = underscore.uniq(self.requireList);
            //过滤掉系统模块
            self.requireList.forEach(function(i){
                if(sysList.indexOf(i) == -1){
                    self.dependList.push(i);
                }
            })
            //一次处理依赖列表里的模块，用npm info 请求其信息并解析
            queue_do(self.dependList,function(_mod,next,context){
                self.depends[_mod] = "*";
                var exec =  require('child_process').exec;
                exec("npm info "+_mod,function(err,out,stderr){
                    if(err){
                        self.config.showError&&console.log("dependparser: child_process exec error！");
                    }else
                    if(stderr){
                        self.config.showError&&console.log("dependparser: child_process exec stderr");
                        self.config.showError&&console.log(stderr);
                    }else{
                        
                        self.depends[out.match(nameReg)[1]] = out.match(versionReg)[1];
                    }
                    next.call(context);
                });
            },function(){
                self.callback(underscore.clone(self.depends));
            })
        
        })
    },
    //解析文件
    parseJsFile : function(_file){
        var text = fs.readFileSync(_file).toString().replace(/\s/,"");
        var match;
        while(match = requireReg.exec(text)){
            this.requireList.push(match[1]);
        }
    }
}
module.exports = exports =function(source,callback,_config){
    var dp = new dependParser();
    dp.source = source;
    dp.callback = callback;
    _config&&underscore.extend(dp.config,_config);
    dp.load();

}
