const Joi = require('@hapi/joi');
const express = require('express');

const meter = require('./meter');
const matching = require('./matching');

const app = express();
app.use(express.json());


const drivers = [
    {id:0, name: 'Quinn', location:[40.1,-73.4], destination: [40.5,-73.5], walkTime: 10, cost: 10},
    {id:1, name: 'Jack', location:[40.2,-73.3], destination: [40.5,-73.5], walkTime: 5, cost: 2}
];

meter.setMeterAvail();
matching.doDisEGS();

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
    const driver = drivers.find(c => c.id === parseInt(req.params.id));
    if (!driver) return res.status(404).send("The driver with given ID is not found.");
    res.send(driver);   // res.send() can only be executed once!
});

app.post('/api/create-driver',(req,res)=>{
    const { error } = validateDriver(req.body); // access property "error" directly without declaring object "result"
    if(error) return res.status(400).send(result.error);    // return to stop this function from executing due to error while sending the error code

    const driver = {
        id: drivers.length, // later id will be assigned by db
        name: req.body.name,
        location: req.body.location,
        destination: req.body.destination,
        walkTime: req.body.walkTime,
        cost: req.body.cost
    };
    drivers.push(driver);
    // console.log(meter.meterAvail);
    res.send(driver);
});

app.put('/api/drivers/:id', (req, res) => {
    // Look up driver
    // If not exist, return 404
    const driver = drivers.find(c => c.id === parseInt(req.params.id));
    if (!driver) return res.status(404).send("The driver with given ID is not found.");

    // Validate
    // If invalid, return 400 - Bad Request
    const { error } = validateDriver(req.body);
    if(error) return res.status(400).send(result.error);

    // Update driver
    // Return updated driver
    driver.name = req.body.name;
    driver.location = req.body.location;
    driver.destination = req.body.destination;
    driver.walkTime = req.body.walkTime;
    driver.cost = req.body.cost;
    
    res.send(driver);
})

app.delete('/api/drivers/:id', (req,res) => {
    // Look up driver
    // If not exist, return 404
    const driver = drivers.find(c => c.id === parseInt(req.params.id));
    if (!driver) return res.status(404).send("The driver with given ID is not found.");

    // Delete
    const idx = drivers.indexOf(driver);
    drivers.splice(idx, 1);

    // Return deleted driver
    res.send(driver);
});


const port = process.env.PORT || 8000;
app.listen(port,()=> console.log(`Listening on port ${port}...`));


function validateDriver(driver){
    const schema = {
        name: Joi.string().min(3).required(),
        location: Joi.array().items(Joi.number()),
        destination: Joi.array().items(Joi.number()),
        walkTime: Joi.number().min(0).max(20),
        cost: Joi.number().min(0)
    };
    return Joi.validate(driver,schema);
}