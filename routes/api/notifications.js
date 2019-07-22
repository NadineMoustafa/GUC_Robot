const express = require('express')
const axios=require('axios')
const mongoose = require('mongoose')
const User=require('../../models/User')
const fetch = require('node-fetch');
const Request = require('../../models/Request')


// exports.getPimsg =  async (req,res) =>{
// res.json({msg:'Meet the robot at the door'})
//   socket.emit('rasppery',{msg:"hihihi"})
// }
 


// module.exports = function(io) {
//     io.on('connection', function(socket) {
//         socket.on('message', function(message) {
//             logger.log('info',message.value);
//             socket.emit('ditConsumer',message.value);
//             console.log('from console',message.value);
//         });
//     })
// };
