const axios=require('axios')
const mongoose = require('mongoose')
const User=require('./User')
const Request = require('./Request')
const Robot = require('./Robot')
const Office = require('./Office')
mongoose.set("useFindAndModify", false);


//Firebase Connection 
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
var options={
    priority:"high",
    timeToLive:60*60*24
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://indoor-d45b9.firebaseio.com"
  });


async function sendToApp(email,payload){
var user=await User.findOne({"email":email})
var registrationToken=user.fireBaseToken
console.log(registrationToken)
var data=null
await admin.messaging().sendToDevice(registrationToken,payload,options)
.then(function(response){
  
    data={ msg:"done Successfully" , data:response}
})
.catch(function(error){
    data={ msg:"error" , data:error}
})
console.log(data)

return data
}

async function getRobot(item) {
    const robotstate=await Robot.find()
    const robots=robotstate[0]
     if(robots.processed==='idle')
     {
         console.log(item)
    const updatedRobot = await Robot.findOneAndUpdate({_id : robots._id},{processed:'busy'})  
    const sender1=await User.findById(item.request.sender)
    const receiver1 = await User.findById(item.request.receiver)
    const Req =  await Request.findOneAndUpdate({_id:item.request._id},{state:"Waiting"})
    const robotLocation =await robots.current_location;
    var senderOffice;
      senderOffice=await Office.findById(sender1.office);
     var body2={
         end:{x:senderOffice.point.x, y:senderOffice.point.y},
         start:{x:Math.round(robotLocation.x),y:Math.round(robotLocation.y)}
     }
    var val=null;
     await axios.post(`https://robotdelivery.herokuapp.com/api/routes/path`,body2)
     .then(res => {
           val={data:res.data.data,msg:"Robot is on his way to you"}
           }
           )   
       .catch(error =>{ 
           val={msg:error.message};

       });
       console.log(val.msg)
         if(val.msg==="Robot is on his way to you") {
             await sendToApp(sender1.email,{data:{msg:"Robot is on his way to you",type:'0'}})
             await  sendToApp(receiver1.email,{ data:{msg: sender1.name+' has sent you a request!',type:'1'}})
         }
         }
         
         return val;
     }
    


module.exports.getRobot=getRobot
module.exports.sendToApp=sendToApp