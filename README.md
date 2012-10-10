自动依赖分析器
===
项目的目标是创建一个小程序，自动帮用户分析出一个项目中所require的模块，以帮助用户编写出精确的`package.json`文件的dependencies和devDependencies属性。

## 实现思路
通过扫描目录中的js文件，正则表达式匹配require调用，提取出项目中require到的所有模块。并且排除掉Node的原生模块、文件模块，提取出依赖的第三方模块。并自动从NPM服务器上查看最新的版本以提供一个推荐的依赖列表。  

## 求谁来帮忙实现
哥太忙了。求对Node感兴趣的人来帮忙实现下。可以玩玩分析文本文件。项目完成后，**奖励两本图灵社区的书**。

##使用

```
var dp=require("dependparser")
//第一个参数为项目路径，最后跟上斜线。
//第二个参数为回调方法，其第一个参数是最后获取的依赖的对象，第二个参数如果出错则是一个Error实例。
//第三个参数是配置参数，目前支持blackList（黑名单数组），showError(请求错误是否在控制台显示错误信息）
dp(process.cwd(),function(result,error){
    if(!error){
        console.log(result)
    }
},{
    blackList:[
        "test.js",
        "example/*"
    ],
    showError:true
});

```
