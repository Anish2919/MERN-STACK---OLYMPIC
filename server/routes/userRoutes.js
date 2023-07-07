const express = require("express")

const controllers = require("../controllers/userController")
const Auth  = require('../middleware/Auth'); 
const schemaMiddleware = require("../middleware/verifyPayload");


const router = express.Router()

router.post("/signin", controllers.signinController)
router.post("/signup", controllers.signupController)
router.post('/sendOTP', controllers.sendOTPController); // send otp controller
router.post('/resetPassword',schemaMiddleware.validateSentUserResetPasswordBody, Auth.CheckUserAvailability, controllers.resetUserPasswordController); 

// put request 
router.put('/updateUserDetails', Auth.AuthorizeUser, controllers.updateUserDetails); // update user details
router.put('/updatePassword',Auth.AuthorizeUser, controllers.updateUserPassword);  // update password


// get request
router.get('/userInfo', Auth.AuthorizeUser, controllers.getUserDetailsController); // get users 
router.get('/:id/verify/:token', controllers.verifyEmailController);  // verify email address
router.get('/:email/verifyOTP/:otp',schemaMiddleware.validteSendOTPParams ,Auth.CheckUserAvailability,controllers.verifyOTPController);  // verify otp 

module.exports = router;