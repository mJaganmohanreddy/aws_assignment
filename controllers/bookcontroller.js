const { default: mongoose } = require('mongoose')
const userModel = require('../models/usermodel')
const moment = require('moment')
const bookModel = require('../models/bookmodel')
const reviewModel = require('../models/reviewmodel')
const validator = require('../validator/validator')
const aws = require("aws-sdk")
const multer = require("multer");
const { json } = require('express/lib/response');


// s3 and cloud stodare
//  step1: multer will be used to get access to the file in nodejs( from previous session learnings)
//  step2:[BEST PRACTISE]:- always write s2 upload function separately- in a separate file/function..exptect it to take file as input and return the uploaded file as output
// step3: aws-sdk install - as package
// step4: Setupconfig for aws authenticcation- use code below as plugin keys that are given to you
//  step5: build the uploadFile funciton for uploading file- use code below and edit what is marked HERE only


//PROMISES:-
// -you can never use await on callback..if you awaited something , then you can be sure it is within a promise
// -how to write promise:- wrap your entire code inside: "return new Promise( function(resolve, reject) { "...and when error - return reject( err )..else when all ok and you have data, return resolve (data)

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "abc/" + file.originalname, //HERE 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })

        // let data= await s3.upload( uploadParams)
        // if( data) return data.Location
        // else return "there is an error"

    })
}


 




       

/*******************************Create Book ************************************** */
const createBooks = async function (req, res) {
    try{
    let data = req.body


    // handling edge cases

    if (validator.isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: 'Please provide input' })
    }

    let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data

    // checking authorisation here

    if ((req.userId != userId)) {
        return res.status(401).send({ status: false, message: 'User is not authorised' })
    }

    if (!validator.isValid(title)) {
        return res.status(400).send({ status: false, message: 'Please provide title' })
    }

    if (!validator.isValid(excerpt)) {
        return res.status(400).send({ status: false, message: 'Please provide excerpt' })
    }

    if (!validator.isValid(userId)) {
        return res.status(400).send({ status: false, message: 'Please provide userId' })
    }

    if (!validator.isValid(ISBN)) {
        return res.status(400).send({ status: false, message: 'Please provide ISBN' })
    }

    if (!validator.isValid(category)) {
        return res.status(400).send({ status: false, message: 'Please provide category' })
    }

    // if (!validator.isValid(subcategory)) {
    //     return res.status(400).send({ status: false, message: 'Please provide subcategory' })
    // }
    // if (!validator.isValid(releasedAt)) {
    //     return res.status(400).send({ status: false, message: 'Please provide release Date' })
    // }

    if (!validator.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }

    // checking if title is unique
    let checkTitle = await bookModel.findOne({ title: data.title })
    if (checkTitle) {
        return res.status(400).send({ status: false, message: "Title already exist" })
    }

    // checking if ISBN is unique
    let checkISBN = await bookModel.findOne({ ISBN: data.ISBN })
    if (checkISBN) {
        return res.status(400).send({ status: false, message: "ISBN already exist" })
    }

    // checking if user exist in user document with the provided userId
    let checkUserId = await userModel.findById(data.userId);
    if (!checkUserId) {
        return res.status(404).send({ status: false, message: "No user found with this userID" });
    }

    if (!(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).test(data.ISBN)) {
        return res.status(400).send({ status: false, message: 'ISBN should be valid' })
    }

    if (!(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/).test(data.releasedAt)) {
        return res.status(400).send({ status: false, message: 'Please enter date in given format' })
    }

    //  creating book document in book model


    // book cover 
    let files = req.files
    if (files && files.length > 0) {
        //upload to s3 and get the uploaded link
        // res.send the link back to frontend/postman
        let uploadedFileURL = await uploadFile(files[0])
        data['bookcover']= uploadedFileURL
        // Book Creation
        const Book = await bookModel.create(data)
        // return res.status(201).send({ status: true, data: Book })
        res.status(201).send({ msg: "Book Cover uploaded succesfully and Book Creation Successfull", Data: Book })
    }
    else {
        res.status(400).send({ msg: "No bookCover found" })
    }


    
} catch (err) {
    res.status(500).send({ status: "error", error: err.message })
}
}



module.exports.createBooks = createBooks


/*******************************get Book By query************************************** */

const getBooks = async function (req, res) {
    try {
        let data = req.query

        if (!validator.isValidObjectId(data.userId) && data.userId) {
            return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
        }


        // find the all data filter and query

        let books = await bookModel.find({ $and: [{ isDeleted: false }, data] })
            .select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 });

        // check data exits or not
        if (books.length <= 0) {
            return res.status(404).send({ status: false, message: 'Data Not Found' })
        }
        return res.status(200).send({ status: true, message: "Books list", data: books })
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports.getBooks = getBooks;

/*******************************get Book By bookId ************************************** */


const getBooksById = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter the valid bookId" });
        }
        let findBookId = await bookModel.findById({ _id: bookId }).select({ ISBN: 0 });

        if (!findBookId)
            return res.status(404).send({ status: false, message: "No Book Data Found" });

        // checking if book is not deleted and fields to select for response

        let reviewData = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ bookId: 1, reviewdBy: 1, rating: 1, review: 1 });
        let bookDataWithReviews = JSON.parse(JSON.stringify(findBookId))
        bookDataWithReviews.reviewData = reviewData
        return res.status(200).send({ status: true, message: "All books", data: bookDataWithReviews });
    }
     catch (err) {
        return res.status(500).send({ status: false, Error: err.message });
    }
};

module.exports.getBooksById = getBooksById;

/*******************************update Book ************************************** */

const updateBookById = async (req, res) => {
    try {
        const bookId = req.params.bookId
        const data = req.body
        const { title, excerpt, ISBN, releasedAt } = data
        const ISBNRagex = /^[\d*\-]{10}|[\d*\-]{13}$/

        // handling edge cases

        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "bookId is not valid" })
        }
        if (validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Provide something to Update" })
        }

        if (title) {
            if (!validator.isValid(title)) {
                return res.status(400).send({ status: false, message: "Title Should be Valid..." })
            }
            if (await bookModel.findOne({ title })) {
                return res.status(400).send({ status: false, message: "Title Already Used" })
            }
        }
        if (excerpt) {
            if (!validator.isValid(excerpt)) {
                return res.status(400).send({ status: false, message: "Excerpt Should be Valid..." })
            }
        }
        if (ISBN) {
            if (!validator.isValid(ISBN)) {
                return res.status(400).send({ status: false, message: "ISBN Should be Valid..." })
            }
            if (!ISBN.match(ISBNRagex)) {
                return res.status(400).send({ status: false, message: "ISBN Should only contain Number and only 10 Or 13 digit" })
            }
            if (await bookModel.findOne({ ISBN })
            ) return res.status(400).send({ status: false, message: "ISBN Already Used" })
        }
        if (releasedAt) {
            if (!validator.isValid(releasedAt)) {
                return res.status(400).send({ status: false, message: "releasedAt Should be Valid..." })
            }
            if (!releasedAt.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
                return res.status(400).send({ status: false, message: "please provide date in valid format" })
            }
        }

        // checking if book document is already deleted 
        const updateBook = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!updateBook) {
            return res.status(404).send({ status: false, message: "No Book Found" })
        }
 
        // updating the document 
        const updatedBooks = await bookModel.findOneAndUpdate({ _id: bookId }, { title: title, excerpt: excerpt, ISBN: ISBN, releasedAt: releasedAt }, { new: true })  //releaseAt
        res.status(200).send({ status: true, message: "update successfully", data: updatedBooks })

    } catch (err) {
        return res.status(500).send({ status: false, Error: err.message })

    }
}

module.exports.updateBookById = updateBookById

/*******************************Delete Book ************************************** */

const deleteBooks = async function (req, res) {
    try{

    let id = req.params.bookId

    if (!isValidObjectId(id)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }

    // checking if book exist with this Id
    let checkBookId = await bookModel.findById({ _id: id });
    if (!checkBookId) {
        return res.status(404).send({ status: false, message: "No book found with this bookId" });
    }

    // checking if book is already deleted

    if (id) {
        let dlbook = await bookModel.findById(id)
        if (dlbook.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Book not found or is already deleted" })
        }

        // deleting the book document and sending response message 

        let deleteBook = await bookModel.findOneAndUpdate({ _id: id },
            { $set: { isDeleted: true, deletedAt: Date.now() } })

        return res.status(200).send({ status: true, message: "The book document is successfully deleted" })
    } else {
        return res.status(400).send({ status: false, message: "bad request" })
    }
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}
}


module.exports.deleteBooks = deleteBooks