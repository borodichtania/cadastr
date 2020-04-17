const request = require('request');
const iconv  = require('iconv-lite');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonexport = require('jsonexport');

const opt = {
    url: 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch.aspx',
    encoding: null,
    form: {
        fldSearchFor: "board",//State:GA",
    }
};
let url = 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch.aspx';

let all = 0;
let hrefPage ='?page1397=';

function getAllData(callbackResult) {
    let startPage = 1;
    let resultData = [];
    request.post(opt, function (err, res, body) {
        if (err) { console.log(err); }
        else{
            let $ = cheerio.load(iconv.decode(body, 'win1251'));
            all = /\d+/.exec($('#QuickSearch > div.search-banner.ui-widget > div.max-records').text());
            all = parseInt(all);
            //console.log('all records '+ all);

            function getData(page, data) {
                if(data.length < all) {
                    console.log(page);
                    opt.url = url + hrefPage + page;

                    request.post(opt, function (err, res, body) {
                        if (err) {console.log(err);}
                        else {
                            let $ = cheerio.load(iconv.decode(body, 'win1251'));

                            //парсим поиск в виде таблицы
                            $('ul.description.keywords').each(function(){
                                // находим ссылку на карту
                                $(this).find('li').find('a').each(function(){
                                    let url = 'http://gwinnettassessor.manatron.com/IWantTo/PropertyGISSearch/PropertyDetail.aspx'+$(this).attr('href');
                                    // console.log(url);
                                    //console.log(page);
                                    // запрашиваем данные по карте

                                    getDataByCard(url, function (row) {
                                        callbackResult(row, data);
                                    });
                                });
                            });
                            page++;
                            getData(page, data);
                        }
                    });
                }else{
                    callbackResult(null, data);
                }
            };
            getData(startPage, resultData);
        }
    });
}



function getDataByCard(url, callback){
    request(url, function (err, res, body) {
        // console.log(url);
        if (err) { console.log(err);//ECONNREFUSED
        }
        else {
            let $ = cheerio.load(iconv.decode(body, 'win1251'));

            let row = {};
            let field = {
                "Property ID":"Parcel ID",
                "Property Class":"Property Type",
                "Address":"Address",
            };
            // находим таблицу с данными
            let owner = $('#lxT1696 > table > tbody > tr:nth-child(2) > td:nth-child(5)').text().trim();
            if (owner == ""){
                owner = $('#lxT1385 > table > tbody > tr:nth-child(1) > td').text().trim();
            }
            row['Owner Name'] = owner;
            $('#lxT1385 > table > tbody').first().find('tr').filter(i => i != 0).each(function (i, element) {
                if(field[$(element).find('th').text()]) {
                    row[field[$(element).find('th').text()]] = $(element).find('td').text().trim();
                }
            });

            callback(row);
            //getByPage(page);
            //data.push(row);
            /*  if(resultData.length < all){
                  //data.push(row);
                  //console.log('add data...'+ resultData.length);
                  callbackResult(row, resultData);
                  getByPage(page, resultData);
              }else{
                  callbackResult(null, resultData);
              }*/
        }
    });
}

getAllData(function (row, resultData) {
        if (row) {
           // console.log(row);
            if (!resultData.some(data => data['Parcel ID'] === row['Parcel ID'])){
                resultData.push(row);
            }
        } else {
            console.log('end, write in file');
            writeData(resultData);
    }
});

function writeData(data) {
    //console.log('write');
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
};
