var path = require('path');
var fs = require("fs");

var urllib = require('urllib');
var walker = require("walkdo");
var queue_do = require("queuedo");
var underscore = require("underscore");
var exec =  require('child_process').exec;
var http = require("http");

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

  var blackListReg = new RegExp(blackList.join("|").replace(/\./g,"\\.").replace(/\*/g,".*"));
  walker(this.source, function (file, next, context) {
    var ext = path.extname(file);
    if ((ext === '.js' || ext === '') && !blackListReg.test(file)) {
        self.parseFile(file);
    }
    next.call(context);
  }, function () {
    //去重
    self.dependList = underscore.uniq(self.requireList)
    // 过滤掉系统模块
    .filter(function (i) {
      return sysList.indexOf(i) === -1;
    });
    self.dependList.forEach(function (name) {
      self.depends[name] = "*";
    });
    if (!self.config.checkVersion) {
      self.callback(null, {
        expect: self.depends,
        actual: packageInfo.dependencies || {}
      });
    } else {
      // 一次处理依赖列表里的模块，用npm info请求其信息并解析
      // http://registry.npmjs.org/dependparser 该用RESTfull接口调用，提升性能
      queue_do(self.dependList, function (_mod, next, context) {
        urllib.request('http://registry.npmjs.org/' + _mod, function (err, data, res) {
          // TODO: err如何处理？
          try {
            var result = JSON.parse(data.toString());
            self.depends[result.name] = result['dist-tags'].latest;
          } catch (e) {
            // TODO: 这里异常被吃掉了
            // TODO: 思考下queue_do在迭代文件的时候，出了异常该如何传递
            throw e;
          }
          next.call(context);
        });
      }, function () {
          self.callback(null, {expect: self.depends, actual: packageInfo.dependencies || {}});
      });
    }
  });
};

//解析文件
// TODO: 添加过滤注释的功能，现在的方式会将注释中的require也一并解析，数据中会存在干扰。
DependParser.prototype.parseFile = function (file) {
  var text = fs.readFileSync(file).toString().replace(/\s/,"");
  var match;
  while ((match = requireReg.exec(text))) {
    this.requireList.push(match[1]);
  }
};

/**
 * 分析依赖并返回结果
 * Examples:
 * ```
 *  var dp = require("dependparser");
 *  dp.process(process.cwd().replace(/test$/,""), {
 *    blackList:[
 *      "test.js"
 *    ],
 *    showError:true
 *  }, function (err, result) {
 *    if (!error) {
 *      console.log(result)
 *    } else {
 *      console.log(error)
 *    }
 *  });
 * ```
 * @param {string} source 要分析的项目路径，最后跟上斜线。
 * @param {object} _config 配置参数，目前支持blackList（黑名单数组），showError(请求错误是否在控制台显示错误信息）
 * @param {function} callback 回调方法，第一个参数如果出错则是一个Error实例，其第二个参数是最后获取的依赖的对象。
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
