const express = require('express')
const axios = require('axios')
const router = express.Router()
const mongoose = require('mongoose')
const User = require('../../models/User')
const fetch = require('node-fetch');
const Request = require('../../models/Request')
const Route = require('../../models/Route')
const Robot = require('../../models/Robot')
const Office = require('../../models/Office')
const { getRobot,sendToApp } = require('../../models/Function')

mongoose.set("useFindAndModify", false);


router.delete('/deleteAll', async (req, res) => {
    try {
        const models = [Request]
        models.forEach(async model => {
            await model.deleteMany({})
            return res.json({ msg: "All requests are deleted" });
        })
    }

    catch (error) {
        // We will be handling the error later
        console.log(error)
    }
})

router.get('/', async (req, res) => {
    //  console.log(makeid(9))
    const requests = await Request.find()
    res.json({ data: requests })
})

router.get("/:id", async (req, res) => {
    const id = req.params.id;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        const u = await Request.findById(id);
        if (u)
            return res.json({ data: u });
        else
            return res.send({ msg: "Request is not found" });
    }
    else
        return res.send({ error: "not valid Request id" });
}
);


router.post('/', async (req, res) => {
    try {
        // console.log(req.body)
        const newRequest = await Request.create(req.body)
        //  console.log(newRequest)
        res.json({ msg: 'Request was created successfully', data: newRequest })
    }
    catch (error) {
        // We will be handling the error later
        console.log(error)
    }
})

// const Notification = require('./notifications');
//  router.post('/:rasperry' , Notification.getPimsg);




router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id
        const deletedRequest = await Request.findByIdAndRemove(id)
        res.json({ msg: 'Request was deleted successfully', data: deletedRequest })
    }
    catch (error) {
        // We will be handling the error later
        console.log(error)
    }
})

router.put('/RobotGoes/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
        if (!request) {
            return res.status(400).json({
                status: 'Error',
                message: 'There is no such Request'
            })
        }
        if (request.state === 'Waiting') {
            const updatedRequest = await Request.findByIdAndUpdate({ _id: req.params.id }, { state: 'In Progress' })
            // console.log(updatedRequest)
            res.json({ msg: 'Request is now in progress' })
        }
        else {
            if (request.state === 'In Progress') {
                res.json({ msg: 'Robot is already in porgress' })
            }
            else {
                res.json({ msg: 'Robot has already arrived' })
            }
        }
    }
    catch (error) {
        console.log(error)
    }

})

router.put('/RobotArrived', async (req, res) => {
    try {
        const request = await Request.findOne({ state: 'In Progress' })
        if (!request) {
            return res.status(400).send({msg:'Your request has already been processed!'})
        }
        const sender = await User.findById(request.sender)
        if (request.state === 'In Progress') {
            const updatedRequest = await Request.findByIdAndUpdate({ _id: request._id }, { state: 'Done' })
            const robotstate = await Robot.find()
            const robots = robotstate[0]
            const finishedRequest = await Request.findByIdAndDelete(request._id)
            const updatedRobot = await Robot.findOneAndUpdate({ _id: robots._id }, { processed: 'idle' })



            const PendingRequests = await Request.find();
            if (PendingRequests.length > 0) {
                var min = PendingRequests[0];
                for (var i = 0; i < PendingRequests.length - 1; i++) {
                    if (PendingRequests.length > 1 && PendingRequests[i].time.getTime() < PendingRequests[i + 1].time.getTime()) {
                        min = PendingRequests[i]
                    }
                }
                const body0 = {
                    request: min
                }
                getRobot(body0).then(t => {
                })
                

            }
            await sendToApp(sender.email,{data:{msg:'Your request has been processed!',type:'0'}})
            return res.status(200).send({ msg: 'Robot has now arrived'})
        }
        else {
            if (request.state === 'Pending') {
                res.json({ msg: 'Robot has not received the package yet' })
            }
            else if (request.state === 'Waiting') {
                res.json({ msg: 'Robot still in its way to way' })
            }
            else {
                res.json({ msg: 'Robot has already arrived' })
            }
        }
    }
    catch (error) {
        console.log(error)
    }

})

router.put('/RobotReturns/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
        const route = await Route.findById(request.route)
        if (!request) {
            return res.status(400).json({
                status: 'Error',
                message: 'There is no such Request'
            })
        }
        if (request.state === 'In Progress') {
            const updatedRoute = await Route.findByIdAndUpdate({ _id: request.route }, { end: route.start, start: { x: 50, y: 50 }, path: { s: 5 } })
            const updatedRequest = await Request.findByIdAndUpdate({ _id: req.params.id }, { state: 'Rejected' })
            res.json({ msg: 'There was a problem, the Robot will return the package to the sender' })
        }
        else {
            if (request.state === 'Waiting') {
                res.json({ msg: 'Robot has not received the package yet' })
            }
            else {
                res.json({ msg: 'Robot has already arrived' })
            }
        }
    }
    catch (error) {
        console.log(error)
    }
})

// Update a Request
router.put('/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
        if (!request) return res.status(404).send({ error: 'Request does not exist' })
        const updatedRequest = await Request.findOneAndUpdate({ _id: req.params.id }, req.body)
        res.json({ data: updatedRequest })
    }
    catch (error) {
        console.log(error)
    }
})

// add request to the database
router.post('/getRobot', async (req, res) => {
    try {
        const sender1 = await User.findOne({ email: req.body.sender })
        const receiver1 = await User.findOne({ email: req.body.receiver })
        // console.log(sender1)
        // console.log(receiver1)
        const senderRequest = await Request.findOne({ sender: sender1._id })
        if (senderRequest) {
            return res.status(400).send({ msg: 'You already have a request' })
        }

        const robotstate1 = await Robot.find()
        const robots1 = robotstate1[0]
        if (robots1.processed === 'idle') {
            const robotstate = await Robot.find()
            const robots = robotstate1[0]
            // console.log(robots)
            const updatedRobot = await Robot.findOneAndUpdate({ _id: robots._id }, { processed: 'busy' })



            const robotLocation = await Robot.find();
            const currLocation = robotLocation[0].current_location

            const body = { sender: sender1._id, receiver: receiver1._id, time: Date.now() }

            var request;
            var senderOffice;
            var receiverOffice;
            request = await Request.create(body);
            // console.log(request)
            const updatedRequest = await Request.findOneAndUpdate({ _id: request._id }, { state: 'Waiting' })
            senderOffice = await Office.findById(sender1.office);

            var body2 = {
                end: { x: senderOffice.point.x, y: senderOffice.point.y },
                start: { x: Math.round(currLocation.x), y: Math.round(currLocation.y) }
            }
            var pointss
            var directio
            await axios.post(`https://robotdelivery.herokuapp.com/api/routes/path`, body2)
                .then(json => {
                    pointss = json.data.data
                })
                .catch(err => { console.log(err.message) });
//return res.status(400).send({ msg: err.message, error: "post request" })
            await axios.post(`https://robotdelivery.herokuapp.com/api/routes/dir`, {points:pointss})
                .then(json => {
                    directio = json.data
                })
                .catch(err => { console.log(err.message) });
                await  sendToApp(req.body.sender,{data:{ msg: 'The Robot is on his way to you',type:'0'}})
                await  sendToApp(req.body.receiver,{ data:{msg: sender1.name+' has sent you a request!',type:'1'}})
            return res.status(200).send({ msg: 'The Robot is on his way to you', directions: directio,data:pointss })
        }
        else {
            const robotstate = await Robot.find()
            const robots = robotstate[0]
            const sender1 = await User.findOne({ email: req.body.sender })
            const receiver1 = await User.findOne({ email: req.body.receiver })
            const robotLocation = await Robot.find();
            const currLocation = robotLocation[0].current_location
            const body = { sender: sender1._id, receiver: receiver1._id, time: Date.now() }

            var request;
            var senderOffice;
            var receiverOffice;
            request = await Request.create(body);
            await  sendToApp(req.body.sender,{data:{ msg: 'The Robot is busy now, your request will be processed soon!',type:'0'}})
            return res.status(200).send({ data: request })

        }
    } catch (error) {
        //await  sendToApp(req.body.sender,{ msg: error.message})
        return res.status(400).send({ msg: error.message, error: "catch" })
    }

})




//Make Request From Robot to Sender
router.post('/requestRobot', async (req, res) => {
    try {
        var request;
        var senderOfficeId;
        var receiverOfficeId;
        var senderOffice;
        var receiverOffice;
        var senderEmail;
        var sender;
        senderEmail = req.body.email
        sender = await User.findOne({ email: senderEmail })
        request = await Request.findOne({ state: "Waiting", sender: sender._id })
        if(!request) return res.status(400).send({msg:'The robot has already moved!'})
        console.log(request)
        senderOfficeId = await User.findById(request.sender);
        receiverOfficeId = await User.findById(request.receiver);
        senderOffice = await Office.findById(senderOfficeId.office);
        receiverOffice = await Office.findById(receiverOfficeId.office);
        console.log(senderOfficeId)
        console.log(receiverOfficeId)
        console.log(receiverOffice)
        var body = {
            end: { x: senderOffice.point.x, y: senderOffice.point.y },
            start: { x: receiverOffice.point.x, y: receiverOffice.point.y }
        }
        console.log(body)
        await axios.post(`https://robotdelivery.herokuapp.com/api/routes/path`, body)
            .then(res => { return res.data })
            .then(json => { return res.status(200).send({ data: json.data }) })
            .catch(err => { return res.status(400).send({ msg: err.message }) });
        body2 = {
            state: 'In Progress'
        }
        console.log("Youssr2")
        await axios.put(`https://robotdelivery.herokuapp.com/api/requests/${request._id}`, body2)
            .catch(err => { console.log(err) });
        
        await sendToApp(receiverOfficeId.email,{data:{msg:"Robot is on his way to you!",type:'1'}})
        return res.status(200).send({msg:'Done!'})
    } catch (error) {
        console.log(error.message)
    }
})
module.exports = router