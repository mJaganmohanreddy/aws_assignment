// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const router = require('./routes/route')


// const multer= require("multer");
// const { AppConfig } = require('aws-sdk');

// const app = express()
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended:true}))

// app.use( multer().any())

// mongoose.connect('mongodb+srv://jaganreddy-functionup:ORj2ygJHT7jbS3y8@cluster0.nduth.mongodb.net/Group28aws?retryWrites=true&w=majority',{
//     useNewUrlParser:true
// })



// .then (() => console.log('mongoDB is connected '))
// .catch(err => console.log(err))
// app.use("/",router)


// app.listen(process.env.PORT||3000,function(){
//     console.log("Express app running on PORT "+(process.env.PORT || 3000))
// })


const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const mongoose = require('mongoose');
const app = express();
const multer= require("multer");
const { AppConfig } = require('aws-sdk');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use( multer().any())

mongoose.connect("mongodb+srv://jaganreddy-functionup:ORj2ygJHT7jbS3y8@cluster0.nduth.mongodb.net/Group28aws?retryWrites=true&w=majority", {
        useNewUrlParser: true
    })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route);




app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});