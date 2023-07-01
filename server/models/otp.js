const mongoose = require('mongoose'); 
const Schema = mongoose.Schema; 

const otpSchema = new Schema({
    email: {type: String, required: true, unique:true},  
    otpCode: {type: Number, required: true}, 
    createdAt: {type: Date, default: Date.now(), expires: 1000 * 60 * 5, required: false}, 
    resetSession: {type:Boolean, default: false, }
}); 

module.exports = mongoose.model('Otp', otpSchema ); 