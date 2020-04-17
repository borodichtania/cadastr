const request = require('request');
const iconv  = require('iconv-lite');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonexport = require('jsonexport');

const opt = {
    url: 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch.aspx',
    encoding: null,
    form: {
        fldSearchFor: "State:GA",
    }
};

function getPages(callback) {
    request.post(opt, function (err, res, body) {
        if (err) throw err;
        let $ = cheerio.load(iconv.decode(body, 'win1251'));
        let hrefs = [];
        hrefs.push('?page1397=1');


        $('#QuickSearch > div.search-banner.ui-widget > div.search-results-bar > div').find('a')
            .filter(function() {
                    if ($(this).attr('href') != '#' && !hrefs.includes($(this).attr('href')))
                        hrefs.push($(this).attr('href'));
    });
        callback(hrefs);
    });
}

function getByPage(page, callback) {
    let url = 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch.aspx';
        opt.url = url+page;
        getUrlsFromSite(opt, function (urls) {
            let data = [];
            additionalRequest(urls, function (row) {
                data.push(row);
                callback(data);
            });
        });
}

function getUrlsFromSite(opt, callback){
    request.post(opt, function (err, res, body) {
        console.log(opt.url);
        if (err) throw err;
        let $ = cheerio.load(iconv.decode(body, 'win1251'));

        const urls = [];
        //парсим поиск в виде таблицы
        $('ul.description.keywords').each(function(){
            // находим ссылку
            $(this).find('li').find('a').each(function(){
                let url = 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch/PropertyDetail.aspx'+$(this).attr('href');
                // собираем ссылки для каждой строки
                urls.push(url);
            })
        });
        callback(urls);
    });
}

function additionalRequest(urls, callback){
    urls.map(url => {
        request(url, function (err, res, body) {
            if (err) throw err;//ECONNREFUSED
            let $ = cheerio.load(iconv.decode(body, 'win1251'));
            // находим таблицу с данными
            let row = {};
            let field = {
                "Property ID":"Parcel ID",
                "Property Class":"Property Type",
                "Address":"Address",
            };
            row['Owner Name'] = $('#lxT1696 > table > tbody > tr:nth-child(2) > td:nth-child(5)').text().trim();

            $('#lxT1385 > table > tbody').first().find('tr').filter(i => i != 0).each(function (i, element) {
                if(field[$(element).find('th').text()]) {
                    row[field[$(element).find('th').text()]] = $(element).find('td').text().trim();
                }
                //data.push(row);

            });
            //console.log(row);
            callback(row);
        });
    });

}

function writeData(data) {
    try {
        jsonexport(data,function(err, csv){
            if(err) return console.log(err);
            fs.writeFile('Gwinnett.csv', csv, function (err) {
                if (err) return console.log(err);
            });
        });
    } catch (err) {
        console.error(err);
    }
}

getPages(function (pages) {
/*    pages.map(page => {
        getByPage(page, function (data) {
            console.log(data);
            writeData(data);
        });
    })*/
    getByPage(pages[15], function (data) {
        writeData(data);
    });
})


