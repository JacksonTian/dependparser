var path = require('path');
var fs = require("fs");

var walker = require("walkdo");
var queue_do = require("queuedo");
var underscore = require("underscore");
var exec =  require('child_process').exec;

var requireReg = /require\(["']([^\.\/]*?)["']\)/g;
var nameReg = /name\s*:\s*'(.*)'/;
var versionReg = /version\s*:\s*'(.*)'/;

//系统模块，take from http://nodejs.org/api/index.json
var sysList = [
  "synopsis",
  "assert",
  "buffer",
  "addons",
  "child_process",
  "cluster",
  "crypto",
  "debugger",
  "dns",
  "domain",
  "events",
  "fs",
  "globals",
  "http",
  "https",
  "modules",
  "net",
  "os",
  "path",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stdio",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "tty",
  "dgram",
  "url",
  "util",
  "vm",
  "zlib"
];
//默认的黑名单
var defaultBlackList = [
  "node_modules/*",
  "test/*",
  "doc/*"
];

var DependParser = function (source, callback) {
  this.depends = {};
  //带有系统模块的依赖列表
  this.requireList = [];
  //最终的依赖列表
  this.dependList = [];
  this.config = {
    blackList : [],
    showError : true
  };
  this.source = source;
  this.callback = callback;
};

DependParser.prototype.load = function () {
  var self = this;
  if (!fs.existsSync(path.join(self.source, "package.json"))) {
    this.callback(new Error("Not a project root, package.json not found!")) ;
    return;
  }

  var packageInfo = require(path.join(self.source, "package.json"));
  var blackList = defaultBlackList.concat(this.config.blackList);
  //加上前缀
  blackList.map(function (v, i) {
    return (self.source + "/" + v).replace(/\/\//g,"/");
  });

  var blackListReg = new RegExp(blackList.join("|"));
  walker(this.source, function (filename, next, context) {
    var ext = path.extname(filename);
    if ((ext === '.js' || ext === '') && !blackListReg.test(filename)) {
      self.parseJsFile(filename);
    }
    next.call(context);
  }, function () {
    //去重
    self.dependList = underscore.uniq(self.requireList)
    // 过滤掉系统模块
    .filter(function (i) {
      return sysList.indexOf(i) === -1;
    });

    if (!self.config.checkVersion) {
      self.callback(null, {
        expect: self.dependList,
        actual: Object.keys(packageInfo.dependencies)
      });
    } else {
      //一次处理依赖列表里的模块，用npm info请求其信息并解析
      // TODO: http://registry.npmjs.org/dependparser 该用RESTfull接口调用，提升性能
      queue_do(self.dependList, function (_mod, next, context) {
        self.depends[_mod] = "*";
        exec("npm info " + _mod, function (err,out,stderr) {
          if (err) {
            if (self.config.showError) {
              console.log("dependparser: child_process exec error！");
            }
          } else {
            var nameMatch = out.match(nameReg);
            var versionMatch = out.match(versionReg);
            if (nameMatch && versionMatch) {
                self.depends[nameMatch[1]] = versionMatch[1];
            } else {
              if (self.config.showError) {
                console.log("dependparser: child_process exec request error！");
                console.log(out);
              }
            }
          }
          next.call(context);
        });
      }, function () {
        self.callback(null, underscore.clone(self.depends));
      });
    }
  });
};

//解析文件
DependParser.prototype.parseJsFile = function (_file) {
  var text = fs.readFileSync(_file).toString().replace(/\s/,"");
  var match;
  while ((match = requireReg.exec(text))) {
    this.requireList.push(match[1]);
  }
};

/**
 * 分析依赖并返回结果
 * Examples:
 * ```
 * var dp = require("dependparser");
 * dp(process.cwd().replace(/test$/,""), function (result, error) {
 *   if(!error){
 *       console.log(result)
 *  } else {
 *      console.log(error)
 *   }
 * }, {
 *   blackList:[
 *      "test.js"
 *   ],
 *   showError:true
 * });
 * ```
 * @param {string} source 要分析的项目路径，最后跟上斜线。
 * @param {object} _config 配置参数，目前支持blackList（黑名单数组），showError(请求错误是否在控制台显示错误信息）
 * @param {function} callback 回调方法，其第一个参数是最后获取的依赖的对象，第二个参数如果出错则是一个Error实例。
 */
exports.process = function (source, _config, callback) {
  if (!callback) {
    callback = _config;
    _config = {};
  }
  var dp = new DependParser(source, callback);
  underscore.extend(dp.config, _config);
  dp.load();
};

/**
 * 版本
 */
exports.version = require('../package.json').version;
