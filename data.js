const fs = require('fs');
const papa = require('papaparse');
const file = fs.createReadStream('./meterLoc.csv');
var count = 0; // cache the running count

let meterLocData;

function doPapaParse(file) {
    papa.parse(file, {
        worker: true, // Don't bog down the main thread if its a big file
        dynamicTyping: true,
        step: function(result) {
            // do stuff with result
        },
        complete: function(results) {
            console.log('parsing complete read', count, 'records.'); 
            meterLocData = results.data;
        }
    });
}

module.exports.parseCsv = doPapaParse;