const nodemailer = require('nodemailer');
const keys = require('../config/keys');

const transport = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
        user: keys.MAILGUN_USER,
        pass: keys.MAILGUN_PASS
    },
    tls: {
        rejectunathorized: false
    }
});

module.exports = {
    sendEmail(from, to, subject, html) {
        return new Promise((resolve, reject)=> {
            transport.sendMail({from, subject, to, html}, (err, info) => {
                if(err) reject(err);

                resolve(info);
            });
        });
    }
}