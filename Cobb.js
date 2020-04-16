const request = require('request');
const iconv  = require('iconv-lite');
const htmlparser = require("htmlparser");
var cheerio = require('cheerio');

const opt = {
    url: 'https://qpublic.schneidercorp.com/Application.aspx?AppID=1051&LayerID=23951&PageTypeID=3&PageID=9968&Q=650607816',
    encoding: null
};

request(opt, function (err, res, body) {
    if (err) throw err;

    var $ = cheerio.load(iconv.decode(body, 'win1251'), {
        xml: {
            normalizeWhitespace: true,
        }
    });
   console.log($('a').toString());


    /*$('table').find('tbody tr:nth-child(1)').each(()=> {
       // $('td').find('a').each(() => {
            console.log($(this).text())
        //})
    })*/

    $('table:nth-child(1) tr').each(function(i, tr){

        console.log($(this));
        /*$('td').each(() =>{
            console.log('td: '+ $(this).text());
        })*/

        //var href = $(this).attr('href');
        //var itemNum = children.eq(i);


       // console.log(i + '  '+href);
       // console.log(a);
    });

});