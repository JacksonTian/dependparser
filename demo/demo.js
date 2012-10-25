var dp = require("../lib/index.js");
dp.process(process.cwd().replace(/test$/,""), {
    blackList:[
        "*test.js"
    ],
    showError:true,
    checkVersion:true
}, function (error,result) {
    if(!error){
        console.log(result)
    }else{
        console.log(error)
    }
});