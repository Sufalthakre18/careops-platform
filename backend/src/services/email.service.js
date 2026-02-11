import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 */
export const sendEmail = async ({ to, subject, html, from = 'CareOps <onboarding@resend.dev>' }) => {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email to new contact
 */
export const sendWelcomeEmail = async (contact, workspace) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${workspace.businessName}!</h1>
        </div>
        <div class="content">
          <p>Hi ${contact.firstName || 'there'},</p>
          <p>Thank you for reaching out to us. We've received your inquiry and our team will get back to you shortly.</p>
          <p>In the meantime, if you have any urgent questions, feel free to reply to this email.</p>
          <p>Best regards,<br>${workspace.businessName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: contact.email,
    subject: `Welcome to ${workspace.businessName}`,
    html,
  });
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (booking, workspace) => {
  const formattedDate = new Date(booking.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .booking-details { background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed! ✓</h1>
        </div>
        <div class="content">
          <p>Hi ${booking.customerName},</p>
          <p>Your booking with ${workspace.businessName} has been confirmed.</p>
          
          <div class="booking-details">
            <h3>Booking Details:</h3>
            <div class="detail-row">
              <strong>Service:</strong>
              <span>${booking.bookingType.name}</span>
            </div>
            <div class="detail-row">
              <strong>Date:</strong>
              <span>${formattedDate}</span>
            </div>
            <div class="detail-row">
              <strong>Time:</strong>
              <span>${formattedTime}</span>
            </div>
            <div class="detail-row">
              <strong>Duration:</strong>
              <span>${booking.duration} minutes</span>
            </div>
            ${booking.bookingType.location ? `
            <div class="detail-row">
              <strong>Location:</strong>
              <span>${booking.bookingType.location}</span>
            </div>
            ` : ''}
          </div>

          <p>We look forward to seeing you!</p>
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>${workspace.businessName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: booking.customerEmail,
    subject: `Booking Confirmed - ${workspace.businessName}`,
    html,
  });
};

/**
 * Send booking reminder email
 */
export const sendBookingReminder = async (booking, workspace) => {
  const formattedDate = new Date(booking.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .reminder-box { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Upcoming Appointment Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${booking.customerName},</p>
          
          <div class="reminder-box">
            <p><strong>This is a friendly reminder about your upcoming appointment:</strong></p>
            <p>📅 ${formattedDate}<br>
            🕐 ${formattedTime}<br>
            📍 ${booking.bookingType.location || 'As discussed'}</p>
          </div>

          <p>We're looking forward to seeing you!</p>
          
          <p>Best regards,<br>${workspace.businessName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: booking.customerEmail,
    subject: `Reminder: Your appointment tomorrow at ${workspace.businessName}`,
    html,
  });
};

/**
 * Send form submission request
 */
export const sendFormRequest = async (formSubmission, contact, workspace) => {
  const formUrl = `${process.env.FRONTEND_URL}/forms/${formSubmission.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Form Submission Required</h1>
        </div>
        <div class="content">
          <p>Hi ${contact.firstName || 'there'},</p>
          <p>We need some additional information from you. Please fill out the form below:</p>
          <p><strong>${formSubmission.form.name}</strong></p>
          <p>${formSubmission.form.description || ''}</p>
          
          <a href="${formUrl}" class="button">Fill Out Form</a>
          
          <p>If you have any questions, feel free to reply to this email.</p>
          
          <p>Best regards,<br>${workspace.businessName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: contact.email,
    subject: `Action Required: Complete ${formSubmission.form.name}`,
    html,
  });
};

/**
 * Send low inventory alert to vendor
 */
export const sendInventoryAlert = async (inventoryItem, workspace) => {
  const recipientEmail = inventoryItem.vendorEmail || workspace.contactEmail;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .alert-box { background-color: #FEE2E2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Inventory Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <p><strong>Item:</strong> ${inventoryItem.name}</p>
            <p><strong>Current Stock:</strong> ${inventoryItem.quantity} ${inventoryItem.unit}</p>
            <p><strong>Threshold:</strong> ${inventoryItem.lowStockThreshold} ${inventoryItem.unit}</p>
          </div>

          <p>The inventory for this item is running low. Please consider restocking soon.</p>
          
          ${inventoryItem.vendorName ? `
          <p><strong>Vendor:</strong> ${inventoryItem.vendorName}<br>
          ${inventoryItem.vendorPhone ? `<strong>Phone:</strong> ${inventoryItem.vendorPhone}` : ''}</p>
          ` : ''}
          
          <p>Best regards,<br>${workspace.businessName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Low Inventory Alert: ${inventoryItem.name}`,
    html,
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendBookingReminder,
  sendFormRequest,
  sendInventoryAlert,
};