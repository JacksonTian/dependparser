var dp = require("../lib/index.js");
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
