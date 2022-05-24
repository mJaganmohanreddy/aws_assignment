const express = require('express')
const router = express.Router()
const userController = require('../controllers/usercontroller')
const bookController = require('../controllers/bookcontroller')
const {Authentication,Authorisation}=require('../Middleware/Middleware')
const reviewController=require('../controllers/reviewcontroller')

router.get("/test-me", function (req, res) {
    res.send("My first ever api!")
})




router.post('/register',userController.createUser)

router.post('/login',userController.loginUser)

router.post('/createBooks',Authentication,bookController.createBooks)

router.get("/books", Authentication,bookController.getBooks);

router.get("/books/:bookId", Authentication,bookController.getBooksById);

router.put("/books/:bookId",Authentication,Authorisation, bookController.updateBookById);

router.delete("/books/:bookId", Authentication,Authorisation, bookController.deleteBooks);

router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReviewData);

router.post('/books/:bookId/review',reviewController.createReview)

router.put("/books/:bookId/review/:reviewId",reviewController.updateReviewDetails);

module.exports = router