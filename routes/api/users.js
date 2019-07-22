const express = require('express')
const router = express.Router()

const User = require('../../models/User')
const userValidator = require('../../validations/userValidation');

var jwt_decode = require('jwt-decode');
const Office = require('../../models/Office');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const tokenKey = require('../../config/keys_dev').secretOrKey;
const passport = require('passport');
const bcrypt = require('bcryptjs');
// Ahmed's Part
const axios=require('axios')
const nodemailer = require("nodemailer")
require('../../config/passport')(passport);



function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

router.post('/forgetMyPassword',async(req,res) => {
  try {

  const UserEmail = req.body.email
  const user = await User.findOne({email:req.body.email})
  if(!user){
    res.json({msg: 'Not Valid'})
  }
  const generatedKey = makeid(9)

  const resetedUser = await User.findByIdAndUpdate({_id : user._id},{resetKey : generatedKey})
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'deliveryrobotguc@gmail.com',
      pass: 'kokowawa98'
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"GUC Delivery Robot"', // sender address
    to: "ahmedelsherif98j@gmail.com", // list of receivers
    subject: "Reset Key", // Subject line
    text: "Your Reset Key is : "+generatedKey, // plain text body
  });

  res.json({msg: 'Valid'})
} catch (error) {
    // console.log(error)
  // res.json({msg: 'Not Valid'})
}
})

router.post('/resetMyPassword',async(req,res) => {
  try {
    const newPassword = req.body.password
    const user = await User.findOne({email:req.body.email})
    if(user.resetKey === req.body.resetKey){
      await axios.put(`http://localhost:3000/api/users/${user._id}`,{password:newPassword})
      res.json({msg: 'Valid'})
    }
    else{
      res.json({msg: 'Not Valid'})
    }
  } catch (error) {
    console.log(error)
  }
})

router.put('/:id', async (req,res) => {
  try {
   const isValidated = userValidator.updateValidation(req.body);
   if (isValidated.error) return { error: isValidated.error.details[0].message };
   const user = await User.findById(req.params.id)
   if(!user) return res.status(404).send({error: 'User does not exist'})
   const data = req.body
   if(data.password){
     const salt = bcrypt.genSaltSync(10)
     const hashedPassword = bcrypt.hashSync(data.password, salt)
     data.password = hashedPassword
   }
   const updatedUser = await User.findByIdAndUpdate({_id : req.params.id},data)
   res.json({msg: 'User updated successfully'})
  }
  catch(error) {
      // We will be handling the error later
      console.log(error)
  }  
})
// End ahmed's Part


router.get('/', async (req,res) => {
  console.log("hihi")
    const users = await User.find()
    res.json({data: users})
})


router.post('/emails', async (req,res) => {
  console.log("hihi")
    const users = await User.find()
    const emails =[]
    for(var i=0;i<users.length;i++)
    {
      emails[i]=users[i].email
    }

    res.json({data: emails})
})


router.post('/', async (req,res) => {
    try {
        const newUser = await User.create(req.body)
        res.json({msg:'User was created successfully', data: newUser})
    }
    catch(error) {
        // We will be handling the error later
        console.log(error)
    }  
 })
 

  router.delete('/:id', async (req,res) => {
     try {
      const id = req.params.id
      const deletedUser = await User.findByIdAndRemove(id)
      res.json({msg:'User was deleted successfully', data: deletedUser})
     }
     catch(error) {
         // We will be handling the error later
         console.log(error)
     }  
  })
 


//Register
router.post('/register', async (req,res) => {
  console.log(req.body)
  const isValidated = userValidator.createValidation(req.body);
  if (isValidated.error) {
      console.log(isValidated.error.details[0].message);
  return  res.status(400).send({msg: isValidated.error.details[0].message ,error:"validation error"}) ;
  }
  var officeName = req.body.office ;
  var officeModel = await Office.findOne({officeNumber  : officeName}); 
  var officeId = officeModel._id
  const body={
    name:req.body.name,
    email:req.body.email,
    password:req.body.password,
    office:officeId,
    fireBaseToken:""
  }
  // const {name,email,password,office}  = {req.body.name,req.body.email,req.body.password,officeId};
  const user = await User.findOne({email:body.email})
  if(user) {
    console.log("already exist")
    return res.status(400).json({error: 'Email already exists',msg:"Email already exists"})
  }
  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(body.password,salt)
  const newUser = new User({
          name:body.name,
          email:body.email,
          password: hashedPassword ,
          office:body.office,
          fireBaseToken:""
          
      })
  newUser
  .save()
  .then(user => res.json({data: user}))
  .catch(err => res.json({error: 'Can not create user'},console.log(err)))
})

//Login
router.post('/login', async (req, res) => {
	try {
    const { email, password } = req.body;
    console.log(req.body)
		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ msg: 'Email does not exist' });
    const match = bcrypt.compareSync(password, user.password);
    const user2 = await User.findOneAndUpdate({email:req.body.email},{fireBaseToken:req.body.fireBaseToken})
		if (match) {
            const payload = {
                id: user.id,
                name: user.name,
                email: user.email
            }
            const token = jwt.sign(payload, tokenKey, { expiresIn: '24h' })
            res.json({data: `Bearer ${token}`})
            return res.json({ data: 'Token' })
        }
		else return res.status(400).send({ password: 'Wrong password',msg:"wrong password" });
	} catch (e) {}
});

//Getting info from token
router.post('/gettingData',async(req,res)=>{
//   console.log("Eshtaghal")
  var token = req.body.token;
//   console.log(req.body)
//   console.log(token+" hi")
  var decoded = jwt_decode(token);
//   console.log(decoded+" haaa")
  const id = decoded.id
//   console.log(id+" hello")
  const returnedUser = await User.findById(id)
//   console.log(returnedUser+" user")
  if(returnedUser)
        return res.json({data:returnedUser.email});
      else
        return res.send({ msg: "User is not found" });
})


router.get("/:id", async (req, res) => {
  const id = req.params.id;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const u = await User.findById(id);
      if(u)
        return res.json({ data: u });
      else
        return res.send({ msg: "User is not found" });

    }
    else 
     return res.send({ error: "not valid user id" });
  }
);
 
 module.exports = router

//  signin=(Button) findViewById(R.id.signin);
//  final  String DataField = "youssrabouyoussif97@gmail.com";
//    DisplayText = (TextView) findViewById(R.id.creation);
//     final String REQUEST_METHOD = "GET";
//     final int READ_TIMEOUT = 15000;
//     final int CONNECTION_TIMEOUT = 15000;

//  try{
//   String result;
//   String inputLine;
//   okhttp3.OkHttpClient client = new OkHttpClient();
//    Request request = new Request.Builder()
//            .url("http://41.128.147.230/3000/users")
//            .get()
//            .addHeader("cache-control", "no-cache")
//            .addHeader("Postman-Token", "9f37e229-5e0a-4356-8c10-0f2b4ee34d87")
//            .build();
//   Log.d("Request", "Reached.");
//   Response response = client.newCall(request).execute();
// } catch (Exception e) {
//   Log.d("Request", "Reached catch.");

//   e.printStackTrace();

// }