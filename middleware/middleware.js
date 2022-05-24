
const jwt=require('jsonwebtoken')
const bookModel=require("../models/bookmodel")

const Authentication=async function (req,res,next){
    try{
    let token=req.headers['x-api-key']
    if(!token) token = req.headers['X-Api-Key']
    if(!token){
        return res.status(400).send({status:false,message:"Please enter token in header"})
    }
    
    // verifying the token provided

    let decodedToken = jwt.verify(token,"Bookmanagement" ,{ignoreExpiration:true})
    
    // if the token is expired

    if(Date.now()>decodedToken.exp*1000){
        return res.status(401).send({status:false, message:"Token expired"})
    }
    
    // checking if the user is authorised in create book api
    req.userId=decodedToken.userId

    // checking if token is valid
    if(!decodedToken){
        return res.status(400).send({status:false,message:"Please enter valid token"})
    }
    next();
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}

    
}

module.exports.Authentication=Authentication

const Authorisation=async function(req,res,next){
    try{
    let token=req.headers['x-api-key']
    if(!token) token = req.headers['X-Api-Key']
    if(!token){
        return res.status(400).send({status:false,message:"Please enter token in header"})
    }
    let bookId = req.params.bookId;
    let decodedToken = jwt.verify(token,"Bookmanagement")
    
    let decoded= decodedToken.userId
    // console.log(decoded)
    // checking if the bookId provided in params exist or not 
    let book= await bookModel.findById(bookId)
    if(!book){
        return res.status(404).send({status:false,message:"Book does not exist"})
    }
     
    // checking if the userId in token is the same as id provided in params 
    let user = book.userId.toString()
        
        if (user != decoded) {
            return res.status(401).send({status:false,message:"Not Authorised!!"})
        }
        next()

    }catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
    
}

module.exports.Authorisation=Authorisation
