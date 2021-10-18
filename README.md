# 自动依赖分析器

项目的目标是创建一个小程序，自动帮用户分析出一个项目中所require的模块，以帮助用户编写出精确的 `package.json` 文件的 dependencies 和 devDependencies 属性。

## 实现思路
通过扫描目录中的 js 文件，正则表达式匹配 require 调用，提取出项目中 require 到的所有模块。并且排除掉Node的原生模块、文件模块，提取出依赖的第三方模块。并自动从 NPM 服务器上查看最新的版本以提供一个推荐的依赖列表。

## 安装

```bash
$ npm i dependparser -g
```

## 使用
命令行使用方式

```bash
$ dependparser <project dir path>
```

代码调用方式

```js
// import the package
const dp = require('dependparser');

/**
 * 第一个参数是项目路径，第二个参数是配置项（黑名单，checkVersion），第三个参数是回调
 */
const result = await parser.process(path.resolve(input), config);
const expectKeys = Object.keys(result.expect);
const actualKeys = Object.keys(result.actual);
```

# License
The MIT License
