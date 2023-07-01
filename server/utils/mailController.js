const nodemailer = require('nodemailer'); 
const config = require('config'); 
const  Mailgen = require('mailgen'); 

const sendEmail = async (email, subject, text, name='') => {
    try {
        const transporter =  createTransporter(); 
        //  nodemailer.createTransport({
        //     pool: true, 
        //     service: 'gmail', 
        //     port: 587, 
        //     auth: {
        //         user: 'assignmenttesting2023@gmail.com', 
        //         pass: 'hehcrqzbvgekfopw', 
        //     }
        // }); 

        let mailGenerator = await createMailGenerator(); 

        let styledEmailBody = {
            body: {
                name: name || 'Olpmpic Game Official email' ,
                intro: text,
                outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
            }
        };
        // create email body 
        let email_body = await mailGenerator.generate(styledEmailBody); 

        // send mail 
        await transporter.sendMail({
            from:'assignmenttesting2023@gmail.com', 
            to: email, 
            subject: subject, 
            html: email_body
        }); 
    } catch(error) {
        console.log('error from send mail', error); 
    }
}

function createTransporter() {
    return nodemailer.createTransport({
        pool: true, 
        service: 'gmail', 
        port: 587, 
        auth: {
            user: config.EMAIL, 
            pass: config.EMAIL_PASSWORD, 
        }
    }); 
}

function createMailGenerator() {
    return new Mailgen({
        theme: 'default', 
        product: {
            name:'Olympic', 
            link:'http://localhost:3000', 
        }
    })
}

module.exports = {
    sendEmail, 
}