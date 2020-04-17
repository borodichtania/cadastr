const request = require('request');
const iconv  = require('iconv-lite');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonexport = require('jsonexport');

const baseURL = 'https://weba.co.clayton.ga.us/';
const startUrl = 'taxcgi-bin/wtx200r.pgm?parcel=12174D%20%20D026';

function getData(progressCallback) {
    let resultData = [];
    let param = 0;
    function nextParcel(href) {

        request(baseURL + href, function(err, response, body) {
            if (err) return progressCallback(err);
            ++param;
            if (param < 2000) {
            let $ = cheerio.load(iconv.decode(body, 'win1251'));

            //parcelId
            let parcelId = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(6) > td:nth-child(2)').text();
            parcelId = parcelId.replace('PARCEL ID . . ', '');

            //ownerName
            let ownerName = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(6) > td:nth-child(1)').text();

            let ownerNameAdditional = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(1)').text();
            if (ownerName.indexOf('&') == ownerName.length-1){
                ownerName = ownerName + ownerNameAdditional;
            }
            //address
            let address;
            if (ownerNameAdditional.indexOf('%') == 0){
                ownerName = ownerName + ownerNameAdditional;
                address = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(8) > td:nth-child(1)').text() + ' '+
                $('#content > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(1)').text();
            }else {
                    let address1 = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(1)').text();
                    let address2 = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(8) > td:nth-child(1)').text();
                    address = address1 + ' ' +address2;
            }
            //propertyType
            let propertyType = $('#content > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(3) > td:nth-child(2)').text();

            let row = {};
            row['Parcel ID'] = parcelId;
            row['Owner Name'] = ownerName;
            row['Property Type'] = propertyType;
            row['Address'] = address;


           // if (!resultData.some(data => data.key === parcelId)){
                progressCallback(row, resultData);
                let nextHref = $('#content > table > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(2) > td > a:nth-child(5)')
                        .attr('href');
                console.log('nextParcel ' + nextHref);
                nextParcel(nextHref);
            } else {
                progressCallback(null, resultData);
            }
        });
    }
    nextParcel(startUrl);
}

getData(function (row, resultData) {
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
    try {
        jsonexport(data,function(err, csv){
            if(err) return console.log(err);
            fs.writeFile('Clayton.csv', csv, function (err) {
                if (err) return console.log(err);
            });
        });
    } catch (err) {
        console.error(err);
    }
}