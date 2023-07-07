const Joi = require('joi'); 
const { catchAndReturnError, createError } = require('../utils/utils');


// Verify send OTP payload 
// 1) schema 
// 2) middleware

// schema
const sentOTPParamsSchema = Joi.object ({
    email:Joi.string().email().required(), 
    otp: Joi.string().required().length(6)
})

// middleware 
const validteSendOTPParams = async(req, res, next) => {
    try{
        // validate the send otp params agains the schema
        const {error} = await sentOTPParamsSchema.validate(req.params); 

        console.log(error);
        // if (error) return res.status(400).send({error: error.details[0].message});
        if(error) return res.status(400).json({errorMessage:'Something went wrong. Please check if you have entered correct email and otp'}); 

        next(); 
    }   catch(error) {
        return res.status(500).json({errorMessage:'Internal Server Error'}); 
    }
}


const sentUserResetPasswordSchema = Joi.object({
    email:Joi.string().email().required(), 
    password: Joi.string().required()
}); 
const validateSentUserResetPasswordBody = async(req,res,next) => {
    try{
        // validate sent body parser
        const {error} = await sentUserResetPasswordSchema.validate(req.body);
        
        if(error) {
            const error = new Error('Bad request'); 
            error.status = 400;
            throw error; 
        }

        next(); 
    } catch(error) {
        if(error.status === 400)  {
            return res.status(400).json({errorMessage:error.message}); 
        }
        return res.status(500).json({errorMessage:'Internal server error !'}); 
    }
}

/**Admin */
const adminSentOTPSchema = Joi.object({
    email: Joi.string().email().required(), 
})
const validateAdminSentOTPBody = async (req, res, next) => {
    try{
        const {error} = await adminSentOTPSchema.validate(req.body); 
        if(error) {
            return res.status(400).json({errorMessage: 'Bad request'});    
        }
        next(); 
    } catch(error) {
        return res.status(500).json({errorMessage:error.message}); 
    }
}

// admin verify otp 
const adminVerifyOTPSchema = Joi.object({
    email:Joi.string().email().required(), 
    opt:Joi.number().required()
}); 
const validateAdminVerifyOTPBody = async (req, res, next) => {
    try{
        const {error} = await adminVerifyOTPSchema.validate(req.body); 
        if(error) {
            return res.status(400).json({errorMessage: 'Bad request'});    
        }
        next(); 
    } catch(error) {
        return res.status(500).json({errorMessage:error.message}); 
    }
}

module.exports = {
    validteSendOTPParams, 
    validateSentUserResetPasswordBody, 
    validateAdminSentOTPBody, 
    validateAdminVerifyOTPBody,

}