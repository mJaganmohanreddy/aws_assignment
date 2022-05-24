const reviewModel = require('../models/reviewmodel')
const bookModel = require('../models/bookmodel')
const userModel = require('../models/usermodel')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const moment = require('moment')


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length == 0
}
const isValid = function (value) {

    if (typeof value === 'undefined' || typeof value === null) { return false }

    if (typeof value === "string" && value.trim().length == 0) { return false }

    return true

}
const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}
const isValidTitle = function (value) {
    return ["Mr", "Mrs", "Miss"].indexOf(value) != -1
}

module.exports ={isValidRequestBody,isValid,isValidObjectId,isValidTitle}