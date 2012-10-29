自动依赖分析器
===
项目的目标是创建一个小程序，自动帮用户分析出一个项目中所require的模块，以帮助用户编写出精确的`package.json`文件的dependencies和devDependencies属性。

## 实现思路
通过扫描目录中的js文件，正则表达式匹配require调用，提取出项目中require到的所有模块。并且排除掉Node的原生模块、文件模块，提取出依赖的第三方模块。并自动从NPM服务器上查看最新的版本以提供一个推荐的依赖列表。  

##安装

```
npm install dependparser -g
```

##使用
命令行使用方式

```
dependparser -i <project path>
```
代码调用方式

```
var dp = require("dependparser");
/**
 * 第一个参数是项目路径，第二个参数是配置项（黑名单，checkVersion），第三个参数是回调
 */
dp.process(process.cwd().replace(/demo$/,""), {
    blackList:[
       // "*demo.js"
    ],
    checkVersion:true
}, function (error,result) {
    if(error){
        //code=1 是致命错误，code=2 是请求错误，不致命。
         console.log(error.code);
        console.log(error.message);
    }else{
        console.log(result); 
    }
});
```
