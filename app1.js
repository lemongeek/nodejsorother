//学习异步并发async
var async=require('async');

var urls=[];
for(var i=0;i<30;i++){
    urls.push('http://datasource_'+i);
}

var concurrencyCount=0;
var fetchUrl=function(url,callback){
   // delay 的值在 2000 以内，是个随机的整数
  var delay = parseInt((Math.random() * 10000000) % 2000, 10);
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
  setTimeout(function () {
    concurrencyCount--;
    //以下这个callback很关键
    callback(null, url + ' html content');
  }, delay);

}


var fetchUrl1=function(url,callback){
    var delay=parseInt((Math.random()*10000000)%2000,10);
    console.log("正在抓取的是：",url,',耗时：'+delay);
    callback(null,url+' content');
}

async.mapLimit(urls,5,function(url,callback){
    fetchUrl1(url,callback);
},function(err,result){
    if(err)
    {
        console.log(err);
    }
    console.log('end:');
    console.log(result);
})