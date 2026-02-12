// Load environment variables
import 'dotenv/config';  
import emailService from './src/services/email.service.js';

async function testEmail() {
  try {
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY); // Check if key is loaded

    const result = await emailService.sendEmail({
      from:'onboarding@resend.dev',
      to: 'sufalthakre8@gmail.com', // replace with your actual email
      subject: 'Test Email from Resend',
      html: '<h1>Hello, this is a test email!</h1>',
    });

    console.log('Email sent!', result);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

testEmail();
