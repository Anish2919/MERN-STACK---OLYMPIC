const config = require('../config/default.json');
const Admin = require("../models/admin");
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const { handleAdminVerificationToken } = require('../utils/tokenController');
const { createError, catchAndReturnError } = require('../utils/utils');
const { sendingOTP, verifyOTP } = require('../utils/otpController');

const hanldeJwtToken = async(adminId, email) => {
    const jwt_token =  await jwt.sign({
        _id: adminId, 
        email: email
    }, config.JWT_SECRET, {expiresIn:"1h"}); 
    return jwt_token; 
}



const adminSignUpController = async(req, res) => {
    try {
        const {email, password, adminRole} = req.body; 
        if(adminRole === 'Master Admin') {
            const masterAdmin = await Admin.findOne({adminRole:adminRole}); 
            if(masterAdmin) {
                const error = new Error(); 
                error.status = 400; 
                throw error; 
            }
        }

        // check if admin already exist 
        const existingAdmin = await Admin.findOne({email:email}); 
        if(existingAdmin) {
            const error = new Error(); 
            error.status = 400; 
            throw error;
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, config.SALT); 
        // create new admin 
        const adminCreated = await Admin.create({
            email: email,
            password: hashedPassword, 
            adminRole: adminRole
        }); 
        
        const adminId = adminCreated._id; 

        // handle token 
        const jwt_token = await hanldeJwtToken(adminId, email); 

        return res.status(200).json({message: 'admin created', adminCreated:adminCreated, jwt_token:jwt_token}); 

    } catch(error) {
        if(error.status === 400) {
            return res.status(400).json({errorMessage:'Admin already exists'})
        }
        return res.status(500).json({errorMessage:error.message}); 
    }
}

//   admin signin controller
const adminSignInController = async(req, res) => {
    try{
        const {email, password} = req.body; 
        if(email === '' || password ===''){
            return res.status(400).json({errorMessage:'Bad request'}); 
        }

        // check user availability 
        const existingAdmin = await Admin.findOne({email:email}); 
        if(!existingAdmin) {
            const error = await createError(404); 
            throw error; 
        } 

        // check credentials 
        const passwordMatched = await bcrypt.compare(password, existingAdmin.password); 

        if(!passwordMatched) {
           const error = await createError(401, 'Password did not match!'); 
           throw error; 
        }
        const adminId = existingAdmin._id; 
        const jwt_token = await hanldeJwtToken(adminId, email); 

        return res.status(200).json({message:'Login successfull', jwt_token: jwt_token}); 

    } catch(error) {
        await catchAndReturnError(res, error); 
    }
}

// forget admin password 
const adminSendOTPController = async(req, res) => {
    try{
        const {email} = req.body; 

        // user availability is checked using middleware 
        await sendingOTP(email,'Admin'); 

        return res.status(200).json({message:'Verification email sent successfully'}); 
    } catch(error) {
        return res.status(error.status ? error.status : 500).json({errorMessage:'Internal server error'}); 
    }
}

const adminVerifyOTPController = async(req, res) => {
    try{
        const {email, otp} = req.body; 

        // user availability is checked using middleware 
        
        await verifyOTP(email, otp); 

        return res.status(200).json({message:'Verification email sent successfully'}); 
    } catch(error) {
        return res.status(error.status ? error.status : 500).json({errorMessage:'Internal server error'}); 
    }
}
module.exports = {
    adminSignUpController, 
    adminSignInController, 
    adminSendOTPController, 
    adminVerifyOTPController, 

}