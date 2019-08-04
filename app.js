const Joi = require('@hapi/joi');
const express = require('express');

const meterData = require('./meterData');
const matching = require('./matching');

const app = express();
app.use(express.json());

let drivers = {};
let driverCount = 0;
// drivers[0] = {name: 'Quinn', location:[40.1,-73.4], destination: [40.5,-73.5], walkDist: 2, price: 10, prefList: [[0,0.2],[1,0.4]], spotId: -1};
// drivers[1] = {name: 'Jack', location:[40.2,-73.3], destination: [40.5,-73.5], walkDist: 0.5, price: 2, prefList: [[3,0.1],[4,0.2]], spotId: -1};    // as examples

// matching.main();


meterData.csvDataPromise
.then((rawMeterData) => {
    console.log('Meter data loaded!');
    matching.main(rawMeterData)
});


app.get('/', (req,res ) => {
    res.send('Now Jack is cracking Express!!!');
});

app.get('/api/spots', (req,res) =>{
    res.send({id: 1, loc:[10, 20]});    // NOTE: switch to db in future
});

app.get('/api/drivers', (req,res) =>{
    res.send(drivers);    // NOTE: switch to db in future
});

app.get('/api/drivers/:id/:locationX/:locationY', (req,res) => {
    // res.send(req.params);

    // 2 lines below commented out due to change of drivers from an array to a dictionary object
    // const driver = drivers.find(c => c.id === parseInt(req.params.id));
    // if (!driver) return res.status(404).send("The driver with given ID is not found.");
    const queryDriverID = req.params.id;
    const queryDriverX = parseFloat(req.params.locationX);
    const queryDriverY = parseFloat(req.params.locationY);
    drivers[queryDriverID].location = [queryDriverX,queryDriverY];
    if (!drivers.hasOwnProperty(queryDriverID)) return res.status(404).send("The driver with given ID is not found.");

    const dataOfMeters = meterData.getRawMeterData();
    // if (!drivers.hasOwnProperty(queryDriverID)) return res.status(404).send("The driver with given ID is not found.");
    if (drivers[queryDriverID].spotId != -1) {
        // driver approach assigned spot
        if (calc_dist_from_lat_lon([queryDriverX, queryDriverY], dataOfMeters[drivers[queryDriverID].spotId][0]) < 0.05) return res.send("taken");
        return res.send(dataOfMeters[drivers[queryDriverID].spotId][0])
    } else {    // Invalid spot
        return res.status(404).send('Spot not found!');
    }
});

// called by users
app.post('/api/create-driver',(req,res)=>{
    const { error } = validateDriver(req.body); // access property "error" directly without declaring object "result"
    if(error) return res.status(400).send(error.details[0].message);    // return to stop this function from executing due to error while sending the error code

    const requestContent = {
        destination: req.body.destination,
        walkDist: req.body.walkDist,
        price: req.body.price,
    };

    const prefListPromise = new Promise(
        function genDriverPrefList(resolve, reject) {
            const newPrefList = [];
            let count = 0;

            const dataOfMeters = meterData.getRawMeterData();   // NOTE: problem here?

            for (const meterID in dataOfMeters) {
                if (dataOfMeters.hasOwnProperty(meterID)) {
                    const destMeterDist = calc_dist_from_lat_lon(requestContent.destination, dataOfMeters[meterID][0]);
                    if (destMeterDist <= requestContent.walkDist && dataOfMeters[meterID][2] <= requestContent.price && count < 20) {
                        newPrefList.push([meterID, destMeterDist]);
                        count += 1;
                    }
                }
            }
        
            newPrefList.sort(orderByDestMeterDist);  // NOTE: check if descending order by destMeterDist
            resolve(newPrefList);
        });

    prefListPromise
    .then((newPrefList) => {
        console.log(newPrefList)
        const driverProperties = {
            // later id will be assigned by db
            name: req.body.name,
            location: req.body.location,
            destination: req.body.destination,
            walkDist: req.body.walkDist,
            price: req.body.price,
            prefList: newPrefList,
            spotId: -1
        };
        drivers[driverCount] = driverProperties;
        res.send(driverCount.toString());
        driverCount += 1;
    })
    .catch((error) => { console.log(error); });
});

// called by server itself to update? or just to test...
app.put('/api/drivers/:id', (req, res) => {
    // Look up driver
    // If not exist, return 404
    const queryDriverID = req.params.id;
    if (!drivers.hasOwnProperty(queryDriverID)) return res.status(404).send("The driver with given ID is not found.");

    // Validate
    // If invalid, return 400 - Bad Request
    const { error } = validateDriver(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Update driver
    // Return updated driver
    const driver = drivers[queryDriverID];
    driver.name = req.body.name;
    driver.location = req.body.location;
    driver.destination = req.body.destination;
    driver.walkDist = req.body.walkDist;
    driver.price = req.body.price;
    driver.prefList = req.body.prefList;
    driver.spotId = req.body.spotId
    
    res.send([queryDriverID, drivers[queryDriverID]]);
})

app.delete('/api/drivers/:id', (req,res) => {
    // Look up driver
    // If not exist, return 404
    const queryDriverID = req.params.id;
    if (!drivers.hasOwnProperty(queryDriverID)) return res.status(404).send("The driver with given ID is not found.");

    // Delete
    const dataOfMeters = meterData.getRawMeterData();
    if (drivers[queryDriverID].spotId != -1) {
        dataOfMeters[drivers[queryDriverID].spotId][4] = -1;
        //Reduce avail maually due to lack of sensors
        dataOfMeters[drivers[queryDriverID].spotId][1] += -1;
        console.log(dataOfMeters[drivers[queryDriverID].spotId][1]);
    };
    delete drivers[queryDriverID];

    // Return deleted spot avail
    res.send("Logout!");
});

module.exports.driversDict = drivers;

const port = process.env.PORT || 8000;
app.listen(port,()=> console.log(`Listening on port ${port}...`));


function validateDriver(driver){
    const schema = {
        name: Joi.string().min(3).required(),
        location: Joi.array().items(Joi.number()).length(2).required(),
        destination: Joi.array().items(Joi.number()).length(2).required(),
        walkDist: Joi.number().min(0).max(10).required(),
        price: Joi.number().min(0).required(),
        prefList: Joi.array().items(Joi.number()).required(),
        spotId: Joi.number().required()
    };
    return Joi.validate(driver,schema);
}


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
    if ( a[1] < b[1] ){ return -1; }
    if ( a[1] > b[1] ){ return 1; }
    return 0;
}