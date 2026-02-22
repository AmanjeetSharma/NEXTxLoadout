import nodemailer from "nodemailer";

/**
 * Brevo SMTP Transporter
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // smtp-relay.brevo.com
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true only if using port 465
    auth: {
        user: process.env.SMTP_USER, // a3030d001@smtp-brevo.com
        pass: process.env.SMTP_PASS, // SMTP key (NOT Brevo password)
    },
});

/**
 * Send email using Brevo SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} content - Email content (text or HTML)
 * @param {boolean} [isHtml=false] - Whether the content is HTML
 */
const sendEmail = async (to, subject, content, isHtml = false) => {
    console.log("sending via Brevo")
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            [isHtml ? "html" : "text"]: content,
        });

        console.log(`✅ Email sent to ${to}`);
        console.log("Message ID:", info.messageId);

        return info;
    } catch (error) {
        console.error("❌ Brevo Email Error:", error);
        throw new Error("Email sending failed. Please try again.");
    }
};

export default sendEmail;