const { default: mongoose } = require('mongoose')
const userModel = require('../models/usermodel')
const validator = require('../validator/validator')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/

/*******************************Create User ************************************** */

const createUser = async function (req, res) {
    try {
        let data = req.body

        // handling edge cases here

        if (validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: 'Please provide input' })
        }
        let { title, name, phone, email, password, address } = data

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: 'Please provide title' })
        }
        if (!validator.isValid(name)) {
            return res.status(400).send({ status: false, message: 'Please provide name' })
        }
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: 'Please provide phone' })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: 'Please provide email' })
        }
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: 'Please provide password' })
        }

        if (!validator.isValidTitle(title)) {
            return res.status(400).send({ status: false, message: 'Please provide appropriate title' })
        }
        if (!(emailRegex.test(data.email))) {
            return res.status(400).send({ status: false, message: 'email should be a valid email address' })
        }

        // checking if email id is unique

        let checkEmail = await userModel.findOne({ email: data.email })
        if (checkEmail) return res.status(400).send({ status: false, message: "Email already exist" })

        if (!/^[2-9]\d{9}$/.test(phone)) {
            return res.status(400).send({ status: false, message: "Enter a valid mobile number" })
        }

        // checking if mobile number is unique
        let checkMobile = await userModel.findOne({ phone: data.phone })
        if (checkMobile) {
            return res.status(400).send({ status: false, msg: "Mobile Number already exist" })
        }

        if (!/^[A-Za-z]\w{8,15}$/.test(password)) {
            return res.status(400).send({ status: false, message: "Password should be greater than 8 and less than equal to 15" })
        }

        // creating the document successfully

        let saveData = await userModel.create(data)

        res.status(201).send({ status: true, message: 'success', data: saveData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: 'error', error: err.message })
    }
}

/*******************************Login User ************************************** */

const loginUser = async function (req, res) {
    try{
    let data = req.body
   

    if (validator.isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: 'Please provide input' })
    }

// if wrong credentials provided   
    let user = await userModel.findOne({ email: data.email, password: data.password })

    if (!user) {
        return res.status(400).send({ status: false, message: "Email Id and password does not match" })
    }
    //  creating token if successfully logged in 

    var token = jwt.sign(
        {userId: user._id.toString()},
         "Bookmanagement", {
        expiresIn: '24hr'
     });

    // setting token in header as well

    res.setHeader("x-api-key", token)
    
    return res.status(200).send({ status: true, message: "Login Successfully", data: token })
    }catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.createUser = createUser
module.exports.loginUser = loginUser
