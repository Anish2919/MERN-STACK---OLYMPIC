const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const config = require("config")

const User = require("../models/user")
const Token =  require('../models/token'); 
const {  sendingOTP, verifyOTP } = require("../utils/otpController");
const { handleVerificationToken } = require("../utils/tokenController");
const { updatePassword, updateUserPasswordUtils } = require("../utils/utils")
const otp = require("../models/otp")


const signinController = async(req, res) => {
    if(req.body.googleAccessToken){
        // gogole-auth
        const {googleAccessToken} = req.body;

        axios
            .get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                "Authorization": `Bearer ${googleAccessToken}`
            }
        })
            .then(async response => {
                const firstName = response.data.given_name;
                const lastName = response.data.family_name;
                const email = response.data.email;
                const picture = response.data.picture;

                const existingUser = await User.findOne({email})

                if (!existingUser) 
                return res.status(404).json({message: "User don't exist!"})

                const token = jwt.sign({
                    email: existingUser.email,
                    id: existingUser._id
                }, config.get("JWT_SECRET"), {expiresIn: "1h"})
        
                res
                    .status(200)
                    .json({result: existingUser, token})
                    
            })
            .catch(err => {
                res
                    .status(400)
                    .json({message: "Invalid access token!"})
            })
    }else{
        // normal-auth
        const {email, password} = req.body;
        if (email === "" || password === "") 
            return res.status(400).json({message: "Invalid field!"});
        try {
            const existingUser = await User.findOne({email})
    
            if (!existingUser) 
                return res.status(404).json({message: "User don't exist!"})
    
            const isPasswordOk = await bcrypt.compare(password, existingUser.password);
    
            if (!isPasswordOk) 
                return res.status(400).json({message: "Invalid credintials!"})
           
            // check if the user is verified
            if(!existingUser.verified) {
                const userId = existingUser._id; 
                const firstName = existingUser.firstName; 
                await handleVerificationToken(userId, email, firstName); 
                return res.status(200).json({message: 'An email has been sent. Please verify!'}); 
            }

            // creating jwt token
            const token = jwt.sign({
                email: existingUser.email,
                id: existingUser._id
            }, config.get("JWT_SECRET"), {expiresIn: "1h"})
            
            // sending result and token 
            const result = {
                email: existingUser.email,
                firstName:existingUser.firstName, 
                lastName:existingUser.lastName
            }
            res
                .status(200)
                .json({result: result, token})
        } catch (err) {
            res
                .status(500)
                .json({message: "Something went wrong!"})
        }
    }
  }

const signupController = async(req, res) => {
    if (req.body.googleAccessToken) {
        const {googleAccessToken} = req.body;
        console.log('google access token'); 
        console.log(googleAccessToken); 

        axios
            .get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                "Authorization": `Bearer ${googleAccessToken}`
            }
        })
            .then(async response => {
                const firstName = response.data.given_name;
                const lastName = response.data.family_name;
                const email = response.data.email;
                const picture = response.data.picture;

                const existingUser = await User.findOne({email})

                if (existingUser) 
                    return res.status(400).json({message: "User already exist!"})

                const result = await User.create({verified:"true",email, firstName, lastName, profilePicture: picture})

                const token = jwt.sign({
                    email: result.email,
                    id: result._id
                }, config.get("JWT_SECRET"), {expiresIn: "1h"})

                res
                    .status(200)
                    .json({result, token,})
            })
            .catch(err => {
                res
                    .status(400)
                    .json({message: "Invalid access token!"})
            })

    } else {
        // normal form signup
        const {email, password, confirmPassword, firstName, lastName} = req.body;

        try {
            if (email === "" || password === "" || firstName === "" || lastName === "" && password === confirmPassword && password.length >= 4) 
                return res.status(400).json({message: "Invalid field!"})

            const existingUser = await User.findOne({email})

            if (existingUser) 
                return res.status(400).json({message: "User already exist!"})

            const hashedPassword = await bcrypt.hash(password, config.SALT); 

            const result = await User.create({email, password: hashedPassword, firstName, lastName})

            // creating token and storing 
            const userId = result._id; 
            await handleVerificationToken(userId, email, firstName); 
            return res.status(200).json({message:'Verification Email has been sent. Please verify.'}); 
        
        } catch (err) {
            res
                .status(500)
                .json({message: "Something went wrong!", errorMessage:err.message}); 
        }

    }
}

// verify email address 
const verifyEmailController = async(req, res) => {
    try {
        // get id from params
        const id = req.params.id; 
        const tokenCode = req.params.token; 
        // check if the user exists or not
        const user = await User.findOne({_id:id}); 
        // return if the user does not exist
        if(!user) 
            return res.status(400).send({message: 'Invalid link'}); 

        // check token same way 
        const userToken = await Token.findOne({userId: id }); 
        if (!userToken || userToken.tokenCode !== tokenCode) {
            return res.status(400).send({message: 'Invalid link'}); 
        }
       
        // update user veirfy
        user.verified = true;
        await user.save(); 
        // remove token 
        await userToken.remove(); 
        
        res.status(200).json({message:'Email verified successfully'}); 

    } catch(error) {
        res.status(500).send({error: error, 'message':'Internal Server Error!'})
    }
}

// get user details 
const getUserDetailsController = async (req, res) => {
    try {
        const {email, id} = req; 
        
       User.findOne({_id:id,email:email}, {password: 0}).then(user => {
        return res.send(user); 
       })

    } catch(error) {
        res.status(500).send({error: 'cannot find the user details'})
    }
}

// forget password and send OTP 
// 1. send otp 
// 2. verif otp 

// send otp
const sendOTPController = async(req, res) => {
    try {
        const {email} = req.body; 

        // check if email is available or not in the request
        if(!email) 
            return res.status(400).send({'message': 'Email is missing!'})

        // check if the email is valid 
        const user = await User.findOne({email: email}, {firstName:1, _id:1}); 
        if(!user) 
            return res.status(404).send({'message':'Email does not exists. Please signUp first!'}); 

        // sending OTP
        const firstName = user.firstName; 
        const userId = user._id; 
        await sendingOTP(email, firstName); 
       
        // send response on success. 
        return res.status(200).send({'message':'OTP verification code has been sent to your email', email})
    } catch(error) {
        return res.status(500).json({error:error.message}); 
    }
}

// verify otp 
const verifyOTPController = async(req, res) => {
    try {
        console.log('verify controller')
        const receivedOTP = req.params.otp;
        const email = req.params.email; 
        console.log('email: ', email); 
        console.log('otp', receivedOTP);

        // verify otp
        await verifyOTP(email, receivedOTP); 
        
        return res.status(200).json({message:'OTP verified.'}); 
    } catch(error) {
        if(error.status===400) {
            return res.status(400).json({errorMessage:error.message})
        }
        return res.status(500).json({message:'internal server error', errorMessage:error.message}); 
    }
}

// reset password
const resetUserPasswordController = async(req, res) => {
    try {
        console.log('email from reset user password')
        const {email, password} = req.body; 
        console.log('email: ', email); 
        console.log('password: ', password);

        const user = await User.findOne({email:email});
        if(!user) {
            return res.status(404).json({errorMessage:'User not found!'}); 
        } 

        // check if the reset session is true
        const userOTPDetails = await otp.findOne({email:email}); 
        if(!userOTPDetails) {
            return res.status(400).json({errorMessage:'OTP expired! Reverify OTP'}); 
        }
        if(!userOTPDetails.resetSession) {
            return res.status(400).json({errorMessage:'OTP not verfied. Verify OTP first!'})
        }

        const hashed_password = await bcrypt.hash(password, config.SALT); 

        user.password = hashed_password; 
        await user.save(); 
        
        // after complition change reset session to false. 
        userOTPDetails.resetSession = false; 
        userOTPDetails.save(); 
        return res.status(200).json({message:'Password changed successfully'})
    } catch(error) {
        return res.status(500).json({errorMessage:error.message}); 
    }
}


// update profile
const updateUserDetails = async(req, res) => {
    try {
        const {firstName, lastName} = req.body; 
        const userId = req.id; 
        
        // check user
        const existingUser = await User.findOne({_id:userId}, {password:0}); 
        if(!existingUser) {
            return res.status(404).json({errorMessage:'User not fount!'}); 
        }
        existingUser.firstName = (firstName) && firstName; 

        if(firstName) {
            existingUser.firstName = firstName; 
        }
        if (lastName)  {
            existingUser.lastName = lastName;
        }
        // if(email) {
        //     existingUser.email = email; 
        // }

        await existingUser.save(); 
        return res.status(200).json({message:'Succesfully updated', result:existingUser})
    } catch(error) {
        return res.status(500).json({message:error.message}); 
    }
}


// update password 
const updateUserPassword = async(req, res) => {
    try {
        const id = req.id; 
        const {oldPassword, newPassword} = req.body; 
        if(!oldPassword || !newPassword) {
            return res.status(400).json({errorMessage:'Old password and new Password is similar'}); 
        }
        // update password // utils
        await updatePassword(id, oldPassword, newPassword, 'user');
         
        return res.status(200).json({message:'Succesfully updated'})
    } catch(error) {
        return res.status(error.status).json({errorMessage:error.message}); 
    }
}




module.exports = {
    signinController,
    signupController, 
    getUserDetailsController, 
    verifyEmailController, 
    sendOTPController,
    verifyOTPController, 
    resetUserPasswordController, 
    updateUserDetails, 
    updateUserPassword, 
}