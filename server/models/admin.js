const mongoose = require('mongoose');
const { Schema } = mongoose;

// Create an admin schema
const adminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    default: 'anishbinita20@gmail.com', 
  },
  password: {
    type: String,
    required: true
  },
   adminRole: {
    type:String, 
    default: 'admin'
  }
});


// Create an admin model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;


/**
 * change password. // token 
 * reset password. --> verification token 'email' 
 */

// functionality 
// create read update and delete user info 
// create new admin 
// unable to create master admin 


// videos 
// upload, read, delete, update. 