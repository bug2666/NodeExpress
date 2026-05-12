import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
    await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html
    });
};

export default sendMail;

