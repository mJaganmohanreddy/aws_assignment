const reviewModel = require('../models/reviewmodel')
const bookModel = require('../models/bookmodel')
const validator = require('../validator/validator')
const mongoose = require('mongoose')
const moment = require('moment')
const reviewDate = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/

/*******************************Create review ************************************** */

const createReview = async function (req, res) {
    try{
    let data = req.params.bookId
    let reviewData = req.body

    // here we are providing validations for edge cases
    if (validator.isValidRequestBody(reviewData)) {
        return res.status(400).send({ status: false, message: 'Please provide input' })
    }
    if (!validator.isValidObjectId(data)) {
        return res.status(400).send({ status: false, message: "Invalid bookId." })
    }
    let { bookId, reviewedAt, rating } = reviewData

    if (!validator.isValid(bookId)) {
        return res.status(400).send({ status: false, message: 'Please provide bookId' })
    }
    if (!validator.isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }
    if (!validator.isValid(reviewedAt)) {
        return res.status(400).send({ status: false, message: 'Please provide reviewed date' })
    }
    if (!validator.isValid(rating)) {
        return res.status(400).send({ status: false, message: 'Please provide rating' })
    }
    
    if (!/^[1-5]\d{0}$/.test(reviewData.rating)) {
        return res.status(400).send({ status: false, message: "rating should be in 1 to 5 Number" })
    }
    if (!(reviewDate).test(reviewData.reviewedAt)) {
        return res.status(400).send({ status: false, message: 'Please enter date in given format' })
    }

    let books = await bookModel.findById({ _id: data },{ isDeleted: false })

    if (!books) {
        return res.status(404).send({ status: false, message: "Book Id not found" })
    }
    let checkBookId = await bookModel.findById(reviewData.bookId);
    if (!checkBookId) {
        return res.status(404).send({ status: false, message: " No book with this Id" });
    }
    if(data != reviewData.bookId){
        return res.status(400).send({ status: false, message: 'Book Id does not match with Params' })
    }
    let deletedBook = await bookModel.findOne({_id:reviewData.bookId,isDeleted:true})
        if(deletedBook){
            return res.status(404).send({ status: false, message: 'Book is deleted' })
        }
    // Creating review document in review collection
    let saveData = await reviewModel.create(reviewData)

    // increasing review count in book collection
    if (saveData) {
        let reviewcount = await bookModel.findOneAndUpdate({ _id: data }, { $inc: { reviews: 1 } })
    }

    res.status(201).send({ status: true, message: 'success', data: saveData })
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}
}
module.exports.createReview = createReview

/*******************************Upadate Review ************************************** */

const updateReviewDetails = async (req, res) => {
    try {
        const bookparams = req.params.bookId
        const reviewparams1 = req.params.reviewId
        const data = req.body
        let { review, rating, reviewedBy } = data

        // handling edge cases here

        if (!validator.isValidObjectId(bookparams)) {
            return res.status(400).send({ status: false, message: "Invalid bookId." })
        }

        if (!validator.isValidObjectId(reviewparams1)) {
            return res.status(400).send({ status: false, message: "Invalid reviewId." })
        }

        if (validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide book details to update.' })
        }
        if (review) {
            if (!validator.isValid(data.review)) return res.status(400).send({ status: false, message: "review Should be Valid..." })

        }
        if (reviewedBy) {
            if (!validator.isValid(data.reviewedBy)) return res.status(400).send({ status: false, message: "reviewedBy  Should be Valid..." })
        }

        // checking if book exist with Id provided in params

        const searchBook = await bookModel.findById({ _id: bookparams })
        if (!searchBook) {
            return res.status(404).send({ status: false, message: 'Book does not exist.' })
        }

        // checking if review exist with Id provided in params
        const searchReview = await reviewModel.findOne({ _id: reviewparams1 })
        if (!searchReview) {
            return res.status(404).send({ status: false, message: 'review does not exist.' })
        }

        // checking if review is updated for the same book Id
        let review1 = await reviewModel.findOne({ $and: [{ bookId: bookparams }, { _id: reviewparams1 }] })
        if (!review1) {
            return res.status(400).send({ status: false, message: 'review Id and book Id  does not match.' })
        }

        //  rating validations
        if (typeof (rating) === 'number') {
            if (!validator.isValid(rating)) return res.status(400).send({ status: false, message: "rating Should be Valid..." })

                if (!/^[1-5]\d{0}$/.test(data.rating)) {
                    return res.status(400).send({ status: false, message: "rating should be in 1 to 5 Number" })
                }
        }
        // finally updating the document and sending it in response
        if (searchBook.isDeleted == false) {
            if (searchReview.isDeleted == false) {
                const changeDetails = await reviewModel.findOneAndUpdate({ _id: reviewparams1 }, { review: review, rating: rating, reviewedBy: reviewedBy }, { new: true })

                res.status(200).send({ status: true, message: "Successfully updated review details.", data: changeDetails })
            }
            else {
                return res.status(400).send({ status: false, message: "Review is deleted." })
            }
        }
        else {
            return res.status(400).send({ status: false, message: "Book is deleted." })
        }
    } catch (err) {
        return res.status(500).send({ status: false, Error: err.message })

    }
}

module.exports.updateReviewDetails = updateReviewDetails


/*******************************Delete Review ************************************** */

const deleteReviewData = async function (req, res) {
    try{

    let bookId = req.params.bookId
    let reviewId = req.params.reviewId

    // handling edge cases here

    if (!validator.isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: "Invalid bookId." })
    }

    if (!validator.isValidObjectId(reviewId)) {
        return res.status(400).send({ status: false, message: "Invalid reviewId." })
    }


    let book = await bookModel.findById({ _id: bookId })
    if (!book) {
        return res.status(404).send({ status: false, message: "no book exist with this id" })
    }

    // checking if review is deleted for the same book Id

    let review1 = await reviewModel.findOne({ $and: [{ bookId: bookId }, { _id: reviewId }] })
    if (!review1) {
        return res.status(400).send({ status: false, message: 'review and book Id  does not match.' })
    }

    // checking if the book document already deleted or not

    const deletealready = await bookModel.findOne({ _id: bookId })
    if (deletealready.isDeleted == true) { return res.status(404).send({ status: false, msg: 'This book is deleted' }) }

    // checking if the reviewId provided exist in review document

    let review = await reviewModel.findById({ _id: reviewId })
    if (!review) {
        return res.status(404).send({ status: false, message: "No review with this reviewId" })
    }

    // checking if the review document already deleted or not

    const reviewedId = await reviewModel.findOne({ _id: reviewId })
    if (reviewedId.isDeleted === true) {
        return res.status(404).send({ status: false, message: "review is already deleted" })
    }

    // finally deleting the document and sending the message for successful deletion

    let deleteBook = await reviewModel.findOneAndUpdate({ _id: reviewId },{ $set: { isDeleted: true, deletedAt: Date.now() }},{new:true})

    // Decreasing the review count in book document
    
    if (deleteBook) {
        let reviewcount = await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } })
    }

    res.status(200).send({ status: true, message:'This review is successfully deleted' })
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}

}


module.exports.deleteReviewData = deleteReviewData