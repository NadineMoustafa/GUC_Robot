const express = require('express')
const mongoose = require('mongoose')
const parser = require('body-parser')
const users = require('./routes/api/users')
const robots = require('./routes/api/robots')
const routes = require('./routes/api/routes')
const requests = require('./routes/api/requests')
const offices = require('./routes/api/offices')
const Request=require('./models/Request')
const User = require('./models/User')
const { getRobot,sendToApp } = require('./models/Function')

const http = require('http'),
app = express(),
server = http.createServer(app)
// io = require('socket.io').listen(server);
// require('./routes/api/notifications')(app,socket);
//const notifications = require('./routes/api/notifications')(io);
const db = require('./config/keys').mongoURI

mongoose
    .connect('mongodb+srv://youssrabouyoussif97:Ya.123456@cluster0-rorl7.mongodb.net/test?retryWrites=true&w=majority')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err))

// Init middleware
app.use(parser.urlencoded({
  extended: false
}));
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get('/', (req,res) => {
   console.log("nadine here")
  // io.emit('message', "hi" )

       console.log("nada here") 
        res.send(`<h1>Robots</h1>`)

})

app.post('/RaspberryPi',async (req,res)=>
{
  try{
  var reqs=await Request.findOne({state:"Waiting"})
  console.log(reqs.sender)
  var sender=await User.findById(reqs.sender)
 console.log(sender)
 await  sendToApp(sender.email,{ data:{msg: 'Meet the robot at the door!'}})
 return res.status(200).send({msg:'Meet the robot at the door'})

  } catch(error){
   return res.status(400).send({msg:error.message,error})
  }
})
//From Sender To Receiver
app.post('/RPreciever', async (req,res)=>
{
  try{
  var reqs=await Request.findOne({state:"In Progress"})
  console.log(reqs.receiver)
  var receiver=await User.findById(reqs.receiver)
 console.log(receiver)
 await  sendToApp(receiver.email,{data:{ msg: 'Meet the robot at the door!'}})
 return res.status(200).send({msg:'Meet the robot at the door'})

} catch(error){
  return res.status(400).send({msg:error.message,error})
}
})

// var mSocket ; 
// app.post('/RaspberryPi',async (req,res)=>
// {
//   try{
//   var reqs=await Request.findOne({state:"Waiting"})
//   console.log(reqs.sender)
//   var sender=await User.findById(reqs.sender)
//  console.log(sender)
//  mSocket.broadcast.emit('ahmed')
//  return res.status(200).send({msg:'Meet the robot at the door'})

//   } catch(error){
//    return res.status(400).send({msg:error.message,error})
//   }
// })
//From Sender To Receiver
// app.post('/RPreciever', async (req,res)=>
// {
//   try{
//   var reqs=await Request.findOne({state:"In Progress"})
//   console.log(reqs.receiver)
//   var receiver=await User.findById(reqs.receiver)
//  console.log(receiver)
//  mSocket.broadcast.emit('rasppery_reciever',{msg:"Robot is outside"})
//  return res.status(200).send({msg:'Meet the robot at the door'})

// } catch(error){
//   return res.status(400).send({msg:error.message,error})
// }
// })

// app.post('/test', (req,res)=>
// {
//   res.json({msg:'Meet ahmed at the door'})
//   console.log("TEST")
//  mSocket.emit('event1',{msg:"Robot is outside"})
 
// })

app.use('/api/users', users)
app.use('/api/robots', robots)
app.use('/api/routes', routes)
app.use('/api/requests', requests)
app.use('/api/offices', offices)


app.use((req,res) =>

res.status(404).send(`<h1>Can not find what you're looking for</h1>`))



// io.on('connection', (socket) => {

//   mSocket =socket;
//    console.log('user connected')

//   socket.on('join', function(userNickname) {
  
//           console.log(userNickname +" : has joined the chat "  )
//           socket.emit('join',{msg:"hihihi"})
//           console.log(userNickname+"haaayyyy")
//       });

//       socket.on('login', function(userNickname) {
  
//         console.log(userNickname +" : has loged in"  )

//         socket.emit('login',{msg:"you are logged in"})
//         console.log(userNickname+"haaayyyy login")
//     });    
    
//     socket.on('event1', function(recMail) {
  
// console.log("event1")
// console.log(recMail)
//      socket.broadcast.emit('event1',recMail)

//   });    

   
  
//    });

const port = process.env.PORT || 3000
server.listen(port, () => console.log(`Server on ${port}`))
