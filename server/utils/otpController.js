const optGenerator = require('otp-generator'); 
const { sendEmail } = require('./mailController');
const otp = require('../models/otp');


const generateOTP = async() => {
        // generate OTP 
        const _otp_code = await optGenerator.generate(6, {
            digits: true, 
            lowerCaseAlphabets: false, 
            upperCaseAlphabets: false, 
            specialChars: false,
        }); 
        return _otp_code; 
}

const storeOTPAndGetOTP = async (email)  => {
    const _otp_code = await generateOTP(); 
    console.log('otp code:', _otp_code); // clg
    const filter = {email:email}; 
    const update = { $set: {email:email, otpCode:_otp_code,createdAt: Date.now()}}; 
    const options = {upsert: true, returnOriginal:false}; //set the upsert options to true to create a new document if it doesn't exist. 
    
    //if otp with email already exists, update. if not create new otp document. 
    const createdOTP =  await otp.findOneAndUpdate(filter, update, options); 
    return createdOTP.otpCode; 
}; 

const sendingOTP = async(email, firstName) => {
    const getOTP = await storeOTPAndGetOTP(email); 
    const style = "cursor:pointer; display:inline; padding:10px 20px; height: fit-content; width:fit-content; border: 1px solid black; color:rgb(104,29,176); "; 
    const message = `<p>Please don't share OTP with others. 
                    <br></br> 
                    OTP Code: <span style='${style}'>${getOTP}</span>
                    </span>`; 
    await sendEmail(email, 'OTP Verification Code', message, firstName); 
}

const verifyOTP = async(email, receivedOTP) => {
    if(!email || !receivedOTP) 
        throw new Error('UserId and OTP missing'); 
    
    // check if user is authenticate

    const existingOTP = await otp.findOne({email:email}); 
    if(!existingOTP  || parseInt(receivedOTP) !== existingOTP.otpCode) {
        const error = new Error('OTP not available. Please Resend OTP!'); 
        error.status = 400; 
        console.log(error); 
        throw error; 
    }

    // update resetSession to true when otp matches 
    existingOTP.resetSession = true; 
    await existingOTP.save(); 
}



module.exports = {
    sendingOTP, 
    verifyOTP,  
}