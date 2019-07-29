const Joi = require('@hapi/joi');
const express = require('express');

const meter = require('./meter');
const matching = require('./matching');

const app = express();
app.use(express.json());

let drivers = {};
let driverCount = 2;
drivers[0] = {name: 'Quinn', location:[40.1,-73.4], destination: [40.5,-73.5], walkDist: 2, price: 10, prefList: [[0,0.2],[1,0.4]], spotId: -1};
drivers[1] = {name: 'Jack', location:[40.2,-73.3], destination: [40.5,-73.5], walkDist: 0.5, price: 2, prefList: [[3,0.1],[4,0.2]], spotId: -1};    // as examples

// meter.setMeterAvail();
matching.main();

app.get('/', (req,res ) => {
    res.send('Now Jack is cracking Express!!!');
});

app.get('/api/spots', (req,res) =>{
    res.send({id: 1, loc:[10, 20]});    // NOTE: switch to db in future
});

app.get('/api/drivers', (req,res) =>{
    res.send(drivers);    // NOTE: switch to db in future
});

app.get('/api/drivers/:id', (req,res) => {
    // res.send(req.params);

    // 2 lines below commented out due to change of drivers from an array to a dictionary object
    // const driver = drivers.find(c => c.id === parseInt(req.params.id));
    // if (!driver) return res.status(404).send("The driver with given ID is not found.");
    const queryDriverID = req.params.id;
    if (!drivers.hasOwnProperty(queryDriverID)) return res.status(404).send("The driver with given ID is not found.");
    res.send([queryDriverID, drivers[queryDriverID]]);   // res.send() can only be executed once!
});

// called by users
app.post('/api/create-driver',(req,res)=>{
    const { error } = validateDriver(req.body); // access property "error" directly without declaring object "result"
    if(error) return res.status(400).send(error.details[0].message);    // return to stop this function from executing due to error while sending the error code

    const driverProperies = {
        // later id will be assigned by db
        name: req.body.name,
        location: req.body.location,
        destination: req.body.destination,
        walkDist: req.body.walkDist,
        price: req.body.price,
        prefList: [-1, -1],
        spotId: -1
    };
    drivers[driverCount] = driverProperies;
    // console.log(meter.meterAvailDict);
    res.send(drivers);
    driverCount += 1;
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
    delete drivers[queryDriverID];

    // Return deleted driver
    res.send(drivers);
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