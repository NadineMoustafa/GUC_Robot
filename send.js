var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://indoor-d45b9.firebaseio.com"
  });
var registrationToken="ekot8wlPKKc:APA91bF2yM-HeVWrTKhqC4vaKWu592sUci6A4k1DcvUkg588PLZdfUUcAucDenFKW39kYTt5LOutuE-TVTSKz8Z93xXYQP47fz-V2J3dwjJooVsf80LYTGoDdmxV3Ik11jnoLl_rCO9I";
var payload={
    data:{
        myKey1:"hello Nadine"
    }
}
var options={
    priority:"high",
    timeToLive:60*60*24
}
admin.messaging().sendToDevice(registrationToken,payload,options)
.then(function(response){
    console.log("done Successfully" ,response)
})
.catch(function(error){
    console.log("error",error)
})