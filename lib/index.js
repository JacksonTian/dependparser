'use strict';

const path = require('path');
const fs = require('fs');

const Walker = require('iwalk');

const requireReg = /require\(["']([^./][^"']*?)["']\)/g;

function parseFile(file) {
  const requires = [];
  // 过滤空格，去掉单行和多行注释
  var text = fs.readFileSync(file, 'utf8')
    .replace(/\s/,'')
    .replace(/\/\/.*?\n/g,'')
    .replace(/\/\*[\s\S]*?\*\//g,'');

  var match;
  while ((match = requireReg.exec(text))) {
    requires.push(match[1]);
  }

  return requires;
}

// 系统模块，take from http://nodejs.org/api/index.json
const sysList = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'debugger',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'dgram',
  'url',
  'util',
  'vm',
  'zlib'
];

// 默认的黑名单
const defaultBlackList = [
  'node_modules/*',
  'test/*',
  'doc/*',
  'assets/*'
];

class DependParser {
  constructor(source, config) {
    // 带有系统模块的依赖列表
    this.config = {
      blackList : [],
      ...config
    };
    this.source = source;
  }

  run() {
    var self = this;
    var packagePath = path.join(self.source, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return Promise.reject(new Error('Not a project root, package.json not found!'));
    }

    var packageInfo = require(packagePath);
    var blackList = defaultBlackList.concat(this.config.blackList);

    //加上前缀
    blackList.map(function (v, i) {
      return (self.source + '/' + v).replace(/\/\//g,'/');
    });

    var blackListReg = new RegExp(blackList.join('|').replace(/\./g,'\\.').replace(/\*/g,'.*'));

    return new Promise((resolve, reject) => {
      var walker = new Walker();
      const requires = [];
      walker.walk(this.source, function (filename, isDirectory) {
        if (!isDirectory) {
          var ext = path.extname(filename);
          if ((ext === '.js' || ext === '') && !blackListReg.test(filename)) {
            requires.push(...parseFile(filename));
          }
        }
      });

      walker.on('end', function (totalFile, totalFolder) {
        const depends = {};
        requires.map((item) => {
          if (item.startsWith('@')) {
            return item;
          }
          // 解决类似 colors/safe
          if (item.indexOf('/')) {
            const [pkg] = item.split('/');
            return pkg;
          }

          return item;
        }).filter(function (i) {
          // 过滤掉系统模块
          return sysList.indexOf(i) === -1;
        }).forEach((item) => {
          // 去重，并建立map
          depends[item] = '*';
        });

        resolve({
          expect: depends,
          actual: packageInfo.dependencies || {}
        });
      });
    });
  }
}

/**
 * 分析依赖并返回结果
 * Examples:
 * ```
 *  const dp = require("dependparser");
 *  const result = await dp.run(process.cwd().replace(/test$/,""), {
 *    blackList:[
 *      "test.js"
 *    ],
 *    showError:true
 *  });
 * ```
 * @param {string} source 要分析的项目路径，最后跟上斜线。
 * @param {object} config 配置参数，目前支持blackList（黑名单数组），showError(请求错误是否在控制台显示错误信息）
 */
exports.process = async function (source, config = {}) {
  const dp = new DependParser(source, config);
  return await dp.run();
};

/**
 * 版本
 */
var filepath = path.join(__dirname, '../package.json');

exports.version = require('kitx').loadJSONSync(filepath).version;
