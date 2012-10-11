var dp = require("dependparser");
dp(process.cwd().replace(/test$/,""), function (result, error) {
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