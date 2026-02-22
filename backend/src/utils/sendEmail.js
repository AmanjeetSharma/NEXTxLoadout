import axios from "axios";

/**
 * Send email using Brevo REST API (Axios version)
 */
const sendEmail = async (to, subject, content, isHtml = false) => {
    try {
        console.log(process.env.BREVO_API_KEY ? "Brevo API key is set" : "Brevo API key is NOT set");
        
        console.log(process.env.BREVO_API_KEY);

        console.log(process.env.EMAIL_SENDER_ADDRESS ? "Email sender address is set" : "Email sender address is NOT set");
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: process.env.EMAIL_SENDER_NAME || "QueueINDIA",
                    email: process.env.EMAIL_SENDER_ADDRESS,
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: isHtml ? content : undefined,
                textContent: !isHtml ? content : undefined,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                },
            }
        );

        console.log(`✅ Email sent to ${to}`);
        console.log("Brevo Message ID:", response.data.messageId);

        return response.data;

    } catch (error) {
        console.error(
            "❌ Brevo API Error:",
            error.response?.data || error.message
        );

        throw new Error(
            error.response?.data?.message || "Email sending failed."
        );
    }
};

export { sendEmail };