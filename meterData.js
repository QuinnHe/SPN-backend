const fs = require('fs');
const csv = require('fast-csv');

const csvData = {};

const p1 = new Promise(
    function readCsv(resolve, reject) {
        fs.createReadStream('./meterLoc.csv')
            .pipe(csv.parse())
            .on('error', (error) => {
                reject(error);
            })
            .on('data', (data) => {
                // csvData[meterID] = [[LON, LAT], avail, price, pref=circumference of earth in km / 2, partner]
                // csvData[data[0]] = [
                //     [data[1], data[2]], Math.round(1 * Math.random()), Math.round(20 * Math.random()), 25000, -1
                // ];
                csvData[data[0]] = [
                    [data[1], data[2]], Math.round(1 * Math.random()), 10, 25000, -1
                ];  // NOTE: fix price at 10 to test, later switch abck to randomized price above
            })
            .on('end', (rowCount) => {
                console.log('Parsing complete, read', rowCount, 'records.');
                resolve(csvData);
            });
    });

const getCsvData = () => csvData;

module.exports.csvDataPromise = p1;
module.exports.getRawMeterData = getCsvData;

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