const request = require('request');
const iconv  = require('iconv-lite');
const cheerio = require('cheerio');

const opt = {
    url: 'https://iaspublicaccess.fultoncountyga.gov/search/advancedsearch.aspx?mode=advanced',
    encoding: null
};

request(opt, function (err, res, body) {
    if (err) throw err;

    let $ = cheerio.load(iconv.decode(body, 'win1251'));
   console.log($('a').text());

   let resultData = [{'key':'value1'},{'key':'value2'}];
    const hasValue = Object.values(resultData);

    console.log(resultData.some(data => data.key === "value2"));
    //console.log($('#ctlBodyPane_ctl00_lblName').text());

});