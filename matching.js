const app = require("./app");
const meter = require("./meter");
const data = require('./data');


// data.readMeterLocData()
// .then((result) => {
//     const meterLocDict = result;   // {'meterID': ['lon', 'lat']}
//     console.log(meterLocDict);
// }).catch((err) => {
//     console.log(err);
// });

// const meterLocDict = {1:(10,20), 2:(20,30)};   // lat, lon


const meterPriceDict = {1:10, 2:5};  // ¥/hr
let meterPrefDict = {1:5, 2:5};  // meter's fiance driver's distance, by default 5km, meaning that the meters won't accept booking if driver currently locates outside 5km radius
let meterPartnerDict = {1:-1, 2:-1};   // meter's fiance driver NOTE: should be a list of drivers in future, currently assuming one spot per meter


function degToRad(deg) {
    return deg * (Math.PI/180);
}

// lon1, lat1, lon2, lat2
function calc_dist_from_lat_lon(loc1, loc2) {
    const R = 6371; // Radius of Earth in km
    let rlat1 = degToRad(loc1[1]);
    let rlat2 = degToRad(loc2[1]);
    let dlon = degToRad(loc2[0]-loc1[0]);
    let dlat = degToRad(loc2[1]-loc1[1]);

    let a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(rlat1) * Math.cos(rlat2) *
            Math.sin(dlon/2) * Math.sin(dlon/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    let d = R * c;  // Distance in km
    return d;
}


function orderByDestMeterDist( a, b ) {
    if ( a[1] < b[1] ){ return 1; }
    if ( a[1] > b[1] ){ return -1; }
    return 0;
  }


  function genDriverPrefList(rawMeterData) {
    for (const driverID in app.driversDict) {
        if (app.driversDict.hasOwnProperty(driverID)) {
            for (const meterID in rawMeterData) {
                if (rawMeterData.hasOwnProperty(meterID)) {
                    let destMeterDist = calc_dist_from_lat_lon(app.driversDict[driverID].destination, rawMeterData[meterID][0]);
                    if (destMeterDist < app.driversDict[driverID].walkDist && meterPriceDict[meterID] < app.driversDict[driverID].price) {
                        app.driversDict[driverID].prefList.push([meterID, destMeterDist]);
                    }
                }
            }
            
            app.driversDict[driverID].prefList.sort(orderByDestMeterDist);  // NOTE: check if descending order by destMeterDist
            // console.log(driver.prefList);
            // console.log(app.driversDict);
            //BUG: driver not global
        }
    }
}


function randomizeMeterAvail(rawMeterData) {
    // Below block is to random-generate spot availability data        
    for (const meterID in rawMeterData) {
        if (rawMeterData.hasOwnProperty(meterID)) {
            let prob = Math.random();
            if (prob > 0.9999 && rawMeterData[meterID][1]>0){
                rawMeterData[meterID][1] += -1;
            }
            else if (pro < 0.0001 && rawMeterData[meterID][1]<10){
                rawMeterData[meterID][1] += 1;
            }
        }
    }
    //
    console.log(rawMeterData[1183087]);
    return rawMeterData;
}


function DisEGS(randomizedMeterData) {
    for (const driverID in app.driversDict) {
        if (app.driversDict.hasOwnProperty(driverID)) {
            const driver = app.driversDict[driverID];   // dummy variable to save access and code
            if (driver.spotId === -1 && driver.prefList.length > 0) {
                app.driversDict[driverID].spotId = driver.prefList[-1][0];

                for (const meterID in randomizedMeterData) {
                    if (randomizedMeterData.hasOwnProperty(meterID)) {
                        const meterProperties = randomizedMeterData[meterID];   // dummy variable to save access and code
                        let locMeterDist = calc_dist_from_lat_lon(driver.location, meterProperties[0]);
                        if (locMeterDist > meterProperties[3]) {
                            app.driversDict[driverID].prefList.pop();
                            app.driversDict[driverID].spotId = -1;
                        } else {
                            // here
                            if (meter.meterAvailDict[meterID] === 0) {
                                const partner = app.driversDict[meterPartnerDict[meterID]]; // NOTE: choose the first found driver to drop if multiple spots a meter
                                console.log(partner)
                                // const partner = app.driversDict.find(c => c.id === meterPartnerDict[meterID]);
                                partner.prefList.pop();
                                partner.spotId = -1;
                            }
                            console.log("Spot under meterID:", meterID, "has been assigned to driver", driver.id);
                            meterPartnerDict[meterID] = driver.id;
                            meterPrefDict[meterID] = locMeterDist;
                        }


                    }
                }


                for (const meterID in meter.meterAvailDict) {
                    let locMeterDist = calc_dist_from_lat_lon(driver.location, meterLocDict[meterID]);
                    if (locMeterDist > meterPrefDict[meterID]) {
                        driver.prefList.pop();
                        driver.spotId = -1;
                    } else {
                        if (meter.meterAvailDict[meterID] === 0) {
                            const partner = app.driversDict[meterPartnerDict[meterID]]; // NOTE: choose the first found driver to drop if multiple spots a meter
                            console.log(partner)
                            // const partner = app.driversDict.find(c => c.id === meterPartnerDict[meterID]);
                            partner.prefList.pop();
                            partner.spotId = -1;
                        }
                        console.log("Spot under meterID:", meterID, "has been assigned to driver", driver.id);
                        meterPartnerDict[meterID] = driver.id;
                        meterPrefDict[meterID] = locMeterDist;
                    }
                }
            }
        }
    }
}


function interval_DisEGS(){
    setInterval(() => {
        // fetchData(genDriverPrefList(DisEGS))
        data.csvDataPromise
        .then((rawMeterData) => {
            genDriverPrefList(rawMeterData);
            randomizeMeterAvail(rawMeterData);
        })
        .then((randomizedMeterData) => DisEGS(randomizedMeterData))
        
    }, 5000);
}

module.exports.main = interval_DisEGS;

// meterLocDict becomes the result of promise, need a lot of changes!