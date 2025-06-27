import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // using Gmail as the email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    const mailOptions = {
        from: process.env.EMAIL_USER, //sender email address
        to: options.to,    //recipient email address
        subject: options.subject, //email subject
        text: options.text, //plain text body
        html: options.html, //html body
    };

    await transporter.sendMail(mailOptions)
}

export default sendEmail;
