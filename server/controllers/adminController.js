const config = require('../config/default.json');
const Admin = require("../models/admin");
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const { handleAdminVerificationToken } = require('../utils/tokenController');
const { createError, catchAndReturnError, updatePassword } = require('../utils/utils');
const { sendingOTP, verifyOTP } = require('../utils/otpController');
const otp = require('../models/otp');
const { sendEmail } = require('../utils/mailController');
const User = require('../models/user');

const hanldeJwtToken = async(adminId, email) => {
    console.log('admn id from handlejwt to k en', adminId, email); 
    const jwt_token =  await jwt.sign({ 
        email: email, 
        id:adminId
    }, config.JWT_SECRET, {expiresIn:"1h"}); 
    return jwt_token; 
}


// sign up
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
        
        const adminId = await adminCreated._id; 
        console.log('adminid from signin admin: ', adminId); 

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
        const result = {_id:existingAdmin._id, email:existingAdmin.email,adminRole: existingAdmin.adminRole}; 
        const jwt_token = await hanldeJwtToken(adminId, email); 

        return res.status(200).json({message:'Login successfull',result:result, jwt_token: jwt_token}); 

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

// verify otp 
const adminVerifyOTPController = async(req, res) => {
    try{
        const {email, otp} = req.params; 

        // user availability is checked using middleware 
        await verifyOTP(email, otp); 

        return res.status(200).json({message:'OTP successfully matched!'}); 
    } catch(error) {
        return res.status(error.status ? error.status : 500).json({errorMessage:'Internal server error'}); 
    }
}

// reset password
const resetAdminPasswordController = async(req, res) => {
    try {
        const {email, password} = req.body; 

        const admin = await Admin.findOne({email:email});
        if(!admin) {
            return res.status(404).json({errorMessage:'Admin not found!'}); 
        } 

        const hashed_password = await bcrypt.hash(password, config.SALT); 

        admin.password = hashed_password; 
        await admin.save();
        
        const getOTP = await otp.findOne({email:email}) 
        if(getOTP) {getOTP.remove()}

        return res.status(200).json({message:'Password changed successfully'})
    } catch(error) {
        return res.status(500).json({message:error.message}); 
    }
}

// add update and create user
const addUserController = async(req, res) => {
    try {
        const {firstName, lastName, email, password} = req.body; 
        if (email === "" || password === "" || firstName === "" || lastName === "" && password === confirmPassword && password.length >= 4) 
            return res.status(400).json({message: "Invalid field!"})

        const existingUser = await User.findOne({email})

        if (existingUser) 
            return res.status(400).json({message: "User already exist!"})

        const hashedPassword = await bcrypt.hash(password, config.SALT); 

        const result = await User.create({email, password: hashedPassword, firstName, lastName})

        const id = result._id; 
        // handle token 
        const jwt_token = await hanldeJwtToken(id, email); 
        const text = `Your account has been created successfully. Please sign in using this credentials. <br></br> email: <span style="color:red;">${email}<span> <p>Password: <span style='color:red;'>${password} </span></p> Don't share this credentials with other and change password after login.`; 

        await sendEmail(email, 'Account created',text,firstName); 
        return res.status(200).json({message: 'Account created successfully'}); 

    } catch(error) {
        if(error.status === 400) {
            return res.status(400).json({errorMessage:'Admin already exists'})
        }
        return res.status(500).json({errorMessage:error.message}); 
    }
}

const readUserListController = async(req, res) => {
    try {
        const userList = await User.find();

        if(!userList) {
            return res.status(404).json({message:'User not available'}); 
        }
        return res.status(200).json({message:'User returned', userList:userList}); 
    } catch(error) {
        console.log(error);
        return res.status(500).json({errorMessage:'internal server error'}); 
    }
}; 

const updateUserController = async(req, res) => {
    try {
        const {firstName, lastName, email, id, password} = req.body; 
        
        // check user
        const existingUser = await User.findOne({_id:id}); 
        if(!existingUser) {
            return res.status(404).json({errorMessage:'User not found!'}); 
        }

        if(firstName) {
            existingUser.firstName = firstName; 
        }
        if (lastName)  {
            existingUser.lastName = lastName;
        }
        if(email) {
            existingUser.email = email; 
        }
        if(password) {
            existingUser.password = await bcrypt.hash(password, config.SALT); 
        }

        await existingUser.save(); 
        return res.status(200).json({message:'User updated successfully'})
    } catch(error) {
        return res.status(500).json({message:error.message}); 
    }
}

const deleteUserController = async(req, res) => {
    try {
        const {id} = req.body; 
        console.log('id from body: ', id);
        // check user
        const existingUser = await User.findOne({_id:id}); 
        if(!existingUser) {
            return res.status(404).json({errorMessage:'User not found!'}); 
        }
        // removing user
        await existingUser.remove(); 
        return res.status(200).json({message:'User deleted successfully'})
    } catch(error) {
        return res.status(500).json({message:error.message}); 
    }
}


// update admin details 
// update profile // require token 
const updateAdminPassword = async(req, res) => {
    try {
        const id = req.id; 
        const {oldPassword, newPassword} = req.body; 
        // update password // utils
        await updatePassword(id, oldPassword,newPassword, 'admin', res);

        return res.status(200).json({message:'Succesfully updated'})
    } catch(error) {
        return res.status(500).json({message:error.message}); 
    }
}

// create Admin // require master admin token 
const createAdminController = async(req, res) => {
    try {
        const id = req.id; 
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
        
        const adminId = await adminCreated._id; 
        console.log('adminid from signin admin: ', adminId); 

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

// delete Admin // require master admin token 
const deleteAdminController  = async(req, res) => {}; 






module.exports = {
    adminSignUpController, 
    adminSignInController, 
    adminSendOTPController, 
    adminVerifyOTPController, 
    resetAdminPasswordController, 
    updateAdminPassword, 
    addUserController, 
    updateUserController, 
    deleteUserController,
    createAdminController, 
    readUserListController
}