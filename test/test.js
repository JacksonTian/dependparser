var dp = require("../lib/index.js");
dp(process.cwd().replace(/test$/,""), function (error,result) {
    if(!error){
        console.log(result)
    }else{
        console.log(error)
    }
}, {
    blackList:[
        "test.js"
    ],
    showError:true
});

dp(process.cwd(), function (result, error) {
    if (!error) {
        console.log(result)
    }
},{
    blackList:[
    ]
});