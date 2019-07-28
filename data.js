const fs = require('fs');
const csv = require('fast-csv');

const p1 = new Promise(function readCsv(resolve, reject) {
    let csvData = {};
    fs.createReadStream('./meterLoc.csv')
    .pipe(csv.parse())
    .on('error', (error) => {
        reject(error);
    })
    .on('data', (data) => {
        // csv[meterID] = [LON, LAT, avail, price, pref, partner ...]
        csvData[data[0]] = [data[1], data[2], Math.round(10 * Math.random()), Math.round(20 * Math.random()), 5, -1];
    })
    .on('end', (rowCount) => {
        console.log('Parsing complete, read', rowCount, 'records.');
        resolve(csvData);
    });
});

module.exports.csvDataPromise = p1;

// async function readCsv() {
//     let csvData = {};
//     let count = 0;
//     fs.createReadStream('./meterLoc.csv')
//     .pipe(csv.parse())
//     .on('data', function(data) {
//         count ++;
//         // csv[meterID] = [LON, LAT, avail, ...]
//         csvData[data[0]] = [data[1], data[2]];
//         // Math.round(10 * Math.random())
//     })
//     .on('end', function(data) {
//         console.log('Parsing complete, read', count, 'records.'); 
//         // console.log(csvData);
//         return csvData;
//     });
// }

// module.exports.readMeterLocData = readCsv;


/*
const papa = require('papaparse');
function doPapaParse() {
    const file = fs.createReadStream('./meterLoc.csv');
    papa.parse(file, {
        worker: true, // Don't bog down the main thread if its a big file
        dynamicTyping: true,
        step: function(result) {
            // do stuff with result
        },
        complete: function(results, file) {
            console.log('parsing complete read', count, 'records.'); 
            meterLocData = results.data;
        }
    });
}
*/