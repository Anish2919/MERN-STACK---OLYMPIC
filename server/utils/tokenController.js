const token = require("../models/token");
const crypto = require('crypto'); 
const { sendEmail } = require("./mailController")



const handleTokenCreation = async(userId) => {
    if(!userId) throw new Error('Missing userId'); 
    // filter 
    // update
    // option 

    // generate token using crypto
    let verificationToken = await crypto.randomBytes(32).toString('hex'); 
    
    const filter = {userId:userId}; 
    const updates = {$set:{userId:userId, tokenCode:verificationToken,createdAt:Date.now()}}
    const options = {upsert: true, returnOriginal:false};

    // update token if available, if not create new. 
    const created_updatedToken =  await token.findOneAndUpdate(filter, updates, options); 
    // returning generated token. 
    return created_updatedToken.tokenCode;
}

const handleVerificationToken = async (userId, email, firstName='', userType='') => {
   try {
    const verificationToken = await handleTokenCreation(userId); 
    console.log('verificatio token from handleToken_signup: ', verificationToken); // clg
    const url = `http://localhost:5000/${userType ? userType : 'users'}/${userId}/verify/${verificationToken}`; 
    const message = `<p>Please don't share this link with others. 
                    <br></br> 
                    Follow this linke: <p style='color:rgb(104,29,176);'>${url}</p>
                    </P`; 
    await sendEmail(email, 'Verificaion link', message, firstName); 
   } catch(err) {
    throw err; 
   }
}



module.exports = {
    handleTokenCreation, 
    handleVerificationToken,

}