const app = require("./app");
// const meterData = require('./meterData');


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


// function orderByDestMeterDist( a, b ) {
//     if ( a[1] < b[1] ){ return 1; }
//     if ( a[1] > b[1] ){ return -1; }
//     return 0;
// }


// function genDriverPrefList(rawMeterData) {
//     for (const driverID in app.driversDict) {
//         if (app.driversDict.hasOwnProperty(driverID)) {
//             let count = 0;
//             for (const meterID in rawMeterData) {
//                 if (rawMeterData.hasOwnProperty(meterID)) {
//                     let destMeterDist = calc_dist_from_lat_lon(app.driversDict[driverID].destination, rawMeterData[meterID][0]);
//                     if (destMeterDist < app.driversDict[driverID].walkDist && rawMeterData[meterID][2] < app.driversDict[driverID].price && count < 5) {
//                         app.driversDict[driverID].prefList.push([meterID, destMeterDist]);
//                         count += 1;
//                     }
//                 }
//             }
            
//             app.driversDict[driverID].prefList.sort(orderByDestMeterDist);  // NOTE: check if descending order by destMeterDist
//             // console.log(driver.prefList);
//             // console.log(app.driversDict);
//             //BUG: driver not global
//         }
//     }
// }


async function randomizeMeterAvail(rawMeterData) {
    // Below block is to random-generate spot availability data        
    for (const meterID in rawMeterData) {
        if (rawMeterData.hasOwnProperty(meterID)) {
            let prob = Math.random();
            if (prob > 0.999999 && rawMeterData[meterID][1]>0){
                rawMeterData[meterID][1] += -1;
                if (rawMeterData[meterID][4] != -1){
                    app.driversDict[rawMeterData[meterID][4]].spotId = -1;
                    rawMeterData[meterID][4] = -1;
                    rawMeterData[meterID][3] = 25000;
                }
            }
            else if (prob < 0.000001 && rawMeterData[meterID][1]<1){
                rawMeterData[meterID][1] += 1;
            }
        }
    }
    //
    // console.log(rawMeterData[1183087]);
    return rawMeterData;
}


function DisEGS(randomizedMeterData) {

    for (const driverID in app.driversDict) {
        if (app.driversDict.hasOwnProperty(driverID)) {
            const driver = app.driversDict[driverID];   // dummy variable to save access and code
            // if (driver.spotId != -1) {
            //     const meterID = driver.spotId;
            //     const meterProperties = randomizedMeterData[meterID];
            //     let locMeterDist = calc_dist_from_lat_lon(driver.location, meterProperties[0]);
            //     randomizedMeterData[meterID][3] = locMeterDist;
            // } else {
            for (let prefIdx = 0 ; prefIdx < driver.prefList.length; prefIdx++) {
                const meterID = driver.prefList[prefIdx][0];
                if (randomizedMeterData.hasOwnProperty(meterID)) {
                    const meterProperties = randomizedMeterData[meterID];   // dummy variable to save access and code
                    let locMeterDist = calc_dist_from_lat_lon(driver.location, meterProperties[0]);
                    if (meterProperties[4] == driverID) {   // no need to challenge oneself
                        break
                    } else {
                        if (locMeterDist < meterProperties[3]) {
                            if (meterProperties[1] === 0) { // meter occupied by outside user
                                const partnerID = meterProperties[4];    // NOTE: choose the first found driver to drop if a meter has multiple spots 
                                console.log("Meter occupied by outside user!\nmeterID: %d, #vacantSpots: %d, currentPartner: %d",meterID, meterProperties[1], partnerID);
                                continue
                            } else {    // meter occupied by system user
                                // const partner = app.driversDict.find(c => c.id === meterPartnerDict[meterID]);
                                const partnerID = meterProperties[4];
                                if (partnerID != -1) {  // driver taken spot is in our system
                                    app.driversDict[partnerID].spotId = -1;
                                }
                                randomizedMeterData[meterID][4] = driverID; // update meter partner
                                randomizedMeterData[meterID][3] = locMeterDist; // update meter preference
                                app.driversDict[driverID].spotId = meterID; // update driver spotID
                                console.log("Spot under meterID:", meterID, "has been assigned to driver", driverID);
                                break;
                            }
                        }
                    }
                }
            }
            // }
        }
    }
}


function interval_DisEGS(rawMeterData){
    setInterval(async () => {
        // fetchData(genDriverPrefList(DisEGS))
        console.log("tick");
        console.log(app.driversDict);
        const randomizedMeterData = await randomizeMeterAvail(rawMeterData);
        DisEGS(randomizedMeterData);
    }, 1000);
}

// function interval_DisEGS(){
//     setInterval(() => {
//         // fetchData(genDriverPrefList(DisEGS))
//         console.log("tick");
//         meterData.csvDataPromise
//         .then((rawMeterData) => {
//             genDriverPrefList(rawMeterData);
//             randomizeMeterAvail(rawMeterData);
//         })
//         .then((randomizedMeterData) => DisEGS(randomizedMeterData))
        
//     }, 5000);
// }

module.exports.main = interval_DisEGS;

// meterLocDict becomes the result of promise, need a lot of changes!