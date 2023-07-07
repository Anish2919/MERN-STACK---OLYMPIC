const config = require('../config/default.json'); 
const Admin = require('../models/admin');
const User = require('../models/user');
const bcrypt = require('bcrypt')




const createError = async(statusCode, message) => {
    const error = new Error(message && message); 
    error.status=statusCode; 
    return error; 
}

const catchAndReturnError = async(res, error) => {
    
    if(error.status) {
        if(error.status === 400) {
            console.log(error.message); 
            return res.status(400).json({errorMessage: error.message || 'Bad Request'}); 
        } 
        if(error.status === 401) {
            return res.status(401).json({errorMessage:error.message}); 
        }
    }
    console.log(error); 
    return res.status(500).json({errorMessage:'Internal server error'}); 
}

// update password function 
const updatePassword = async(id, oldPassword, newPassword, modelName) => {
    let existingUser = ''; 
    if(modelName==='admin') {
        existingUser = await Admin.findOne({_id:id});
    } 
    if(modelName==='user') {
        existingUser = await User.findOne({_id:id}); 
    }
    if (!existingUser) {
        const error = new Error('Bad request. Login and try again');
        error.status = 400; 
        throw error; 
    } 

   const compareOldPasswords = await bcrypt.compare(oldPassword,existingUser.password); 

   if(!compareOldPasswords) {
    const error = new Error('Password didnot match'); 
    error.status=400; 
    throw error; 
   }
    
    const hashed_password = await bcrypt.hash(newPassword, config.SALT); 

    existingUser.password = hashed_password; 
    await existingUser.save(); 
}


module.exports = {
    createError,
    catchAndReturnError, 
    updatePassword,

}