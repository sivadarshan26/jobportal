import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

export const sendStatusEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to,
        subject,
        text
    };

    console.log('🚀 Sending email...');
    console.log('🟡 To:', to);
    console.log('📄 Subject:', subject);
    console.log('✉️ Text:', text);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📨 Response:', info.response);
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.error('📛 Full error:', error);
    }
};
