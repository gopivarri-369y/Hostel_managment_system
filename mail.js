const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service : 'mail';
    auth:{
        user:'gopivarri5612v@gmail.com';
        pass 
    }
})