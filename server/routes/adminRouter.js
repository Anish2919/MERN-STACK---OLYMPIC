const express = require('express'); 
const controller = require('../controllers/adminController');
const verifyPayloadMiddleware = require('../middleware/verifyPayload');
const Auth = require('../middleware/Auth');


const adminRouter = express.Router(); 


adminRouter.post('/signup', controller.adminSignUpController); 
adminRouter.post('/signin',controller.adminSignInController); // login router
adminRouter.post('/sendotp',Auth.checkAdminAvailability, verifyPayloadMiddleware.validateAdminSentOTPBody , controller.adminSendOTPController); // forget password
adminRouter.post('/resetPassword',Auth.checkOTPAvailability ,Auth.checkAdminAvailability, controller.resetAdminPasswordController); // reset password
adminRouter.post('/createAdmin',Auth.checkOTPAvailability, Auth.AuthorizeMasterAdmin, controller.createAdminController); 

adminRouter.get('/:email/verifyOTP/:otp',controller.adminVerifyOTPController);  // verify otp 

//verify admin 
adminRouter.get('/verifyMasterAdmin',Auth.AuthorizeUser, Auth.AuthorizeAdmin,(req, res) => {
    try{
        res.status(200).json({'message':'Welcome Master Admin'}); 
    } catch(error) {

    }
} )


// put request
adminRouter.put('/updatePassword', Auth.AuthorizeUser, controller.updateAdminPassword); // update password

// user functions 
adminRouter.post('/addUser',Auth.AuthorizeUser,Auth.AuthorizeAdmin, controller.addUserController); // create user
adminRouter.put('/updateUserDetails', Auth.AuthorizeUser,Auth.AuthorizeAdmin, controller.updateUserController); // update user
adminRouter.post('/deleteUser', Auth.AuthorizeUser,Auth.AuthorizeAdmin,controller.deleteUserController);

adminRouter.get('/getUserList',Auth.AuthorizeUser, Auth.AuthorizeAdmin, controller.readUserListController); // get user list

module.exports = adminRouter; 