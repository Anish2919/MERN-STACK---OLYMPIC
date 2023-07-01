const express = require('express'); 
const controller = require('../controllers/adminController');
const verifyPayloadMiddleware = require('../middleware/verifyPayload');
const Auth = require('../middleware/Auth');


const adminRouter = express.Router(); 


adminRouter.post('/signup', controller.adminSignUpController); 
adminRouter.post('/signin',controller.adminSignInController); // login router
adminRouter.post('/sendotp',Auth.checkAdminAvailability, verifyPayloadMiddleware.validateAdminSentOTPBody , controller.adminSendOTPController); // forget password


module.exports = adminRouter; 