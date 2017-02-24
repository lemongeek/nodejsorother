'use strict'
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');
var req = require('request');
var request = require('superagent');
var iconv = require('iconv-lite');//编码


var fetchData = [];//存放抓取到的数据
/*睡眠函数，控制间隔，以免被封IP*/
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
//蚂蜂窝自由行商城
var defaulturl = 'http://www.mafengwo.cn/search/s.php?q=丽江&p=1&t=sales&kt=1';

var urls = []
/*
*获取页面上的线路基础信息
*type 类别 keyword关键词
*/
var GetData = function (keyword) {
    var startdtime = Date.now();
    let encodestr = iconv.encode(defaulturl, 'utf8');
    let url = iconv.decode(new Buffer(encodestr.toString()), 'utf8')
    request.get(url)
        .end(function (err, res) {
            console.log(res.text);
            //var html = iconv.decode(res.text, 'gb2312')
            var $ = cheerio.load(res.text);
            var eles = $(".clearfix .ct-text");
            //遍历元素
            var count = 0;
            eles.each(function () {
                let starttime1 = Date.now();
                count++;
                let title = $(this).find('h3').find('a').eq(0).text();//标题
                let content = $(this).find('.seg-desc').eq(0).text();
                let keywords = "";
                let shortcontent = "";
                if (content.startsWith('【')) {//以【】开头的标记成亮点/关键词
                    keywords = content.substr(0, content.indexOf('】') + 1);
                    shortcontent = content.substr(content.indexOf('】') + 1);
                } else {
                    shortcontent = content;
                }

                let reading = $(this).find('ul li').eq(1).text().trim();
                let saled = $(this).find('ul li').eq(2).text().trim();
                let price = $(this).find('ul li').eq(3).text().trim();
                let item = {
                    title: title,
                    keywords: keywords,
                    shortcontent: shortcontent,
                    reading: reading,
                    saled: saled,
                    price: price
                }
                fetchData.push(item);
                let costtime = Date.now() - starttime1;
                console.log('收录记录：', count, '条,线路：', title, '耗时：', costtime + "毫秒")
            })
            console.log(fetchData);
        })
    //callback(null,keyword + 'Call back content');
}
var countSuccess = 0; // 成功数
var curCount = 0;
//根据url获取信息
var GetDataByUrl = function (url, callback) {
    var startdtime = Date.now();
    curCount++; // 并发数

    req({
        url: url,
        encoding: null // gbk转码关键代码
    }, function (err, res, body) {
        if (err || res.statusCode != 200) {
            console.error(err);
            console.log('抓取该页面失败，重新抓取该页面..')
            console.log(url)
            return false;
        }

        console.log(curCount + ', 抓取: ' + url)
        var html = iconv.decode(body, 'utf8')
        var $ = cheerio.load(html);
        // console.log(html);
        var eles = $(".clearfix .ct-text");
        //遍历元素
        var count = 0;
        eles.each(function () {
            let starttime1 = Date.now();
            count++;
            let title = $(this).find('h3').find('a').eq(0).text();//标题
            let content = $(this).find('.seg-desc').eq(0).text();
            let keywords = "";
            let shortcontent = "";
            if (content.startsWith('【')) {//以【】开头的标记成亮点/关键词
                keywords = content.substr(0, content.indexOf('】') + 1);
                shortcontent = content.substr(content.indexOf('】') + 1);
            } else {
                shortcontent = content;
            }

            let reading = $(this).find('ul li').eq(1).text().trim();
            let saled = $(this).find('ul li').eq(2).text().trim();
            let price = $(this).find('ul li').eq(3).text().trim();
            let item = {
                title: title,
                keywords: keywords,
                shortcontent: shortcontent,
                reading: reading,
                saled: saled,
                price: price
            }
            fetchData.push(item);
            //curCount--;//并发数
            countSuccess++;//成功数
            let costtime = Date.now() - starttime1;
            console.log('并发数：' + curCount, ',收录记录：', countSuccess, '条,线路：', title, '耗时：', costtime + "毫秒")
            //sleep(100);
        })
        //console.log(fetchData);
        sleep(100);
        callback(null, url + 'Call back content');
    });
    //superagent 不能和iconv一起使用

}

var startindex = 0;
var pagecount = 10;
var keyword = 'lijiang';
var FetchPage = function (pagecount, keyword) {
    var pathurl = 'http://www.mafengwo.cn/search/s.php?q=' + keyword;
    for (var i = 1; i <= pagecount; i++) {
        urls.push(pathurl + '&p=' + i + '&t=sales&kt=1')
    }

    // urls.forEach(function(url) {
    //     GetDataByUrl(url)
    // }, this);
    //
    async.mapLimit(urls, 2, function (url, callback) {
        GetDataByUrl(url, callback);
        sleep(100);
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        // 访问完成的回调函数
        console.log('----------------------------');
        console.log('抓取成功，共有数据：' + fetchData.length);
        console.log('----------------------------');
        var t = JSON.stringify(fetchData);
        fs.writeFileSync('data.json', t);
    });
}
FetchPage(pagecount, keyword);
//GetData('丽江')