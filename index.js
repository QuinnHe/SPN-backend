const Joi = require('@hapi/joi');
const express = require('express');
const meter = require('./meter');
const app = express();

const drivers = [
    {id:1, name: 'Quinn', location:[40.1,-73.4], destination: [40.5,-73.5], walkTime: 10, cost: 10},
    {id:2, name: 'Jack', location:[40.2,-73.3], destination: [40.5,-73.5], walkTime: 5, cost: 2}
];

app.use(express.json());

meter.setMeterAvail();

app.get('/', (req,res) => {
    res.send('Test');
});

app.post('/api/spots',(req,res)=>{
    const { error } = validateDriver(req.body);

    if(error) return res.status(400).send(result.error);

    const driver = {
        id: drivers.length+1,
        name: req.body.name,
        location: req.body.location,
        destination: req.body.destination,
        walkTime: req.body.walkTime,
        cost: req.body.cost
    }
    drivers.push(driver);
    // console.log(meter.meterAvail);
    res.send(driver);
})

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

const port = process.env.PORT || 8000;
app.listen(port,()=> console.log(`Listening on port ${port}...`));
