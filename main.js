
var walker = require("walkdo")
var queue_do = require("queuedo")
var underscore=require("underscore")

var fs = require("fs")
//带有系统模块的依赖列表
var requireList = []
//最终的依赖列表
var dependList = []
var depends = {
    
}
var reg = new RegExp("require\\([\"']([^./]*?)[\"']\\)","g")
//系统模块，take from http://nodejs.org/api/index.json
var sysList = [ "synopsis", "assert", "buffer", "addons", "child_process", "cluster", "crypto", "debugger", "dns", "domain", "events", "fs", "globals", "http", "https", "modules", "net", "os", "path", "process", "punycode", "querystring", "readline", "repl", "stdio", "stream", "string_decoder", "timers", "tls", "tty", "dgram", "url", "util", "vm", "zlib"]


//解析文件
var parseJsFile = function(_file,next,context){
    var text = fs.readFileSync(_file).toString().replace(/\s/,"")
    var match
    while(match = reg.exec(text)){
        requireList.push(match[1])
    }
}

var dependParser = function(source){
    if(!fs.existsSync(source+"/package.json")){
        console.log("package.json not found! broken!")
        return;
    }
    walker(source,function(f,next,context){
        if(/\.js$/.test(f)){
            parseJsFile(f,next,context)
        }
        next.call(context)
    },function(){
        //去重
        requireList = underscore.uniq(requireList)
        //过滤掉系统模块
        requireList.forEach(function(i){
            if(sysList.indexOf(i) == -1){
                dependList.push(i)
            }
        })
        //一次处理依赖列表里的模块，用npm info 请求其信息并解析
        queue_do(dependList,function(_mod,next,context){
            depends[_mod] = ""
            console.log("request "+_mod+"'s info")
            var exec  =  require('child_process').exec,
            free   =  exec("npm info "+_mod,function(err,out,stderr){
                if(err){
                    console.log("child_process exec error！")
                }else
                if(stderr){
                    console.log("child_process exec stderr")
                    console.log(stderr)
                }else{
                    console.log("parsing "+_mod+"'s info")
                    var nameReg = /name\s*:\s*'(.*)'/
                    var versionReg = /version\s*:\s*'(.*)'/
                    depends[out.match(nameReg)[1]] = out.match(versionReg)[1]
                }
                next.call(context)
            });
        },function(){
            console.log("final dependencies:")
            console.log(JSON.stringify(depends))
            
        })
        
    })
}
module.exports = exports = dependParser;
