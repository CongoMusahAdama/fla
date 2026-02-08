
const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config();

async function testEmail() {
    console.log('Testing Brevo Email with:');
    console.log('API Key:', process.env.BREVO_API_KEY ? 'Present' : 'Missing');
    console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Test OTP Email";
    sendSmtpEmail.htmlContent = "<html><body><h1>This is a test OTP: 123456</h1></body></html>";
    sendSmtpEmail.sender = { name: "FLA Test", email: process.env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.to = [{ email: process.env.BREVO_SENDER_EMAIL, name: "Test User" }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('API called successfully. Returned data: ', JSON.stringify(data));
    } catch (error) {
        console.error('Error calling Brevo API:');
        if (error.response && error.response.body) {
            console.error(JSON.stringify(error.response.body, null, 2));
        } else {
            console.error(error);
        }
    }
}

testEmail();
