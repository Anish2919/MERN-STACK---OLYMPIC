const jwt = require("jsonwebtoken")
const config = require("config"); 
const User = require("../models/user");
const Admin = require("../models/admin");
const otp = require("../models/otp");



 async function AuthorizeUser(req, res, next) {
    try {
        if(!req.headers.authorization) {
            return res.status(400).send({error: "Missing access token!"}); 
        }
        // split access token from 'Bearer' 
        const token = req.headers.authorization.split(" ")[1];
        console.log(token);  

        // retrive the user details by decoding access token 
        const decodedToken = await jwt.verify(token,config.JWT_SECRET); 

        // getting user details form decoded Token 
        const {email, id} = decodedToken;
        req.email = email; 
        req.id = id; 

        console.log(email, id); 
        next(); 
    } catch(error) {
        return res.status(500).json({errorMessage: error.message});  
    }
}

async function AuthorizeAdmin(req, res, next) {
    try {
        const id = req.id;
        
        // check if user is admin 
        const admin = await Admin.findOne({_id:id}); 
        if(!admin) {
            return res.status(401).json({errorMessage:'Unauthorized Access'}); 
        }
        
        next(); 
    } catch(error) {
        return res.status(500).json({errorMessage: error.message});  
    }
}

async function AuthorizeMasterAdmin(req, res, next) {
    try {
        const id = req.id;
        
        // check if user is admin 
        const admin = await Admin.findOne({_id:id}); 
        if(!admin) {
            return res.status(401).json({errorMessage:'Unauthorized Access'}); 
        }
        if(admin.adminRole !== "Master Admin") {
            return res.status(401).json({errorMessage: 'You are unauthorized to create admin'});
        }
        
        next(); 
    } catch(error) {
        return res.status(500).json({errorMessage: error.message});  
    }
}

// check availability of the user
async function CheckUserAvailability(req, res, next) {
    try {
        const userId = req.params.id || req.body.id; 
        const email = req.params.email || req.body.email; 

        let existingUser; 

        // check if the user is available
        if(userId) {
            existingUser = await User.findOne({_id:userId}, {password:0, _id:0}); 
        } else if(email) {
            existingUser =  await User.findOne({email:email}, {password:0, _id:0}); 
        }

        // If user is not available
        if(!existingUser) {return res.status(401).json({errorMessage: 'Unauthorized Access'})}

        next(); 
        
    } catch(error) {
        return res.status(500).json({errorMessage:error.message, from:'check user activity'}); 
    }
}

async function checkAdminAvailability(req, res, next) {
    try{
        const {email} = req.body || req.params; 

        const existingAdmin = await Admin.findOne({email:email}); 
        if(!existingAdmin) {
            return res.status(400).json({errorMessage:'Bad request.'}); 
        }

        next(); 
    } catch(error) {
        req.status(500).json({errorMessage:'Internal Server error'}); 
    }
}

async function checkOTPAvailability(req,res,next) {
    try{
        const {email, password} = req.body; 
        const existingOTP = await otp.findOne({email:email}); 
        if(!existingOTP) {
            return res.status(400).json({errorMessage:'Bad request.'}); 
        }
        next(); 
    } catch(error) {
        req.status(500).json({errorMessage:'Internal Server error'}); 
    }
}

module.exports = {
    AuthorizeUser, 
    CheckUserAvailability, 
    checkAdminAvailability,
    checkOTPAvailability, 
    AuthorizeAdmin,
    AuthorizeMasterAdmin,
    
}