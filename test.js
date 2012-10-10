var dp = require("dependparser");
dp(process.cwd(),function(result,error){
    if(!error){
        console.log(result)
    }
},{
    blackList:[
        "test.js"
    ],
    showError:true
});

dp(process.cwd(),function(result,error){
    if(!error){
        console.log(result)
    }
},{
    blackList:[
    ]
});