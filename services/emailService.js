const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Use environment variables for email config
    // For now, configure with default SMTP (can be updated with real credentials)
    this.transporter = null;
    this.initialized = false;
    
    // Try to initialize if env vars are set
    this.initialize();
  }

  initialize() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM = 'BillboardBids <noreply@billboardbids.com>'
    } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT) || 587,
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
      this.fromAddress = SMTP_FROM;
      this.initialized = true;
      console.log('✅ Email service initialized');
    } else {
      console.log('⚠️  Email service not configured (set SMTP_* env vars)');
      // Create test transporter for development
      this.createTestAccount();
    }
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      this.fromAddress = 'BillboardBids <noreply@billboardbids.com>';
      this.initialized = true;
      console.log('📧 Using Ethereal test email account');
      console.log(`   Preview emails at: https://ethereal.email/messages`);
    } catch (error) {
      console.error('Failed to create test email account:', error.message);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.initialized) {
      console.log('📧 Email not sent (service not initialized):', subject);
      return { success: false, reason: 'not_configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text: text || this.stripHtml(html),
        html
      });

      console.log('✅ Email sent:', subject);
      console.log('   Message ID:', info.messageId);
      
      // If using Ethereal, log preview URL
      if (info.messageId && this.transporter.options.host === 'smtp.ethereal.email') {
        console.log('   Preview: https://ethereal.email/message/' + info.messageId);
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email failed:', subject, error.message);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Booking confirmation to advertiser
  async sendBookingConfirmation(booking, billboard) {
    if (!booking.customerEmail && !booking.advertiserEmail) {
      console.log('⚠️  No email address for booking confirmation');
      return { success: false, reason: 'no_email' };
    }
    
    const subject = `Booking Confirmed: ${billboard.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
          .label { font-weight: 600; color: #6b7280; font-size: 14px; }
          .value { font-size: 16px; color: #111827; margin-top: 5px; }
          .total { background: #3b82f6; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
          .total-amount { font-size: 32px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; }
          .status-pending { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Your billboard booking has been received and is being processed.</p>
            
            <div class="detail-row">
              <div class="label">CAMPAIGN</div>
              <div class="value">${booking.campaignName || booking.campaign_name}</div>
            </div>

            <div class="detail-row">
              <div class="label">BILLBOARD</div>
              <div class="value">${billboard.name}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">${billboard.location}</div>
            </div>

            <div class="detail-row">
              <div class="label">SCHEDULE</div>
              <div class="value">${new Date(booking.startTime || booking.start_time).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit',
                timeZoneName: 'short'
              })}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Duration: ${(booking.duration || booking.durationHours || booking.duration_hours)} hour${(booking.duration || booking.durationHours || booking.duration_hours) > 1 ? 's' : ''}</div>
            </div>

            <div class="detail-row">
              <div class="label">STATUS</div>
              <div class="value">
                <span class="status status-pending">${(booking.approvalStatus || booking.approval_status) === 'approved' ? '✅ Approved' : '⏳ Pending Review'}</span>
              </div>
            </div>

            <div class="total">
              <div style="font-size: 16px; margin-bottom: 10px;">Total Amount</div>
              <div class="total-amount">$${(booking.pricing?.total || booking.totalPrice || 0).toFixed(2)}</div>
            </div>

            <h3 style="margin-top: 30px;">Next Steps:</h3>
            <ol style="line-height: 2;">
              <li><strong>Creative Review:</strong> Your creative is being reviewed by the billboard owner</li>
              <li><strong>Approval:</strong> You'll receive an email once approved (typically within 24 hours)</li>
              <li><strong>Live:</strong> Your ad will go live at the scheduled time</li>
            </ol>

            <p style="margin-top: 30px; padding: 15px; background: white; border-radius: 6px; font-size: 14px;">
              <strong>Questions?</strong> Reply to this email or visit our help center at <a href="http://92.112.184.224/apps/billboardbids/">billboardbids.com</a>
            </p>
          </div>
          <div class="footer">
            <p>BillboardBids - Making outdoor advertising accessible to everyone</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated confirmation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(booking.customerEmail || booking.advertiserEmail, subject, html);
  }

  // New booking alert to billboard owner
  async sendNewBookingAlert(booking, billboard, ownerEmail) {
    const subject = `New Booking: ${billboard.name} - ${booking.campaignName || booking.campaignName || booking.campaign_name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
          .label { font-weight: 600; color: #6b7280; font-size: 14px; }
          .value { font-size: 16px; color: #111827; margin-top: 5px; }
          .revenue { background: #10b981; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
          .revenue-amount { font-size: 32px; font-weight: bold; }
          .action-button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">💰 New Booking Received!</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">You have a new booking that requires creative approval.</p>
            
            <div class="detail-row">
              <div class="label">BILLBOARD</div>
              <div class="value">${billboard.name}</div>
            </div>

            <div class="detail-row">
              <div class="label">CAMPAIGN</div>
              <div class="value">${booking.campaignName || booking.campaign_name}</div>
            </div>

            <div class="detail-row">
              <div class="label">SCHEDULE</div>
              <div class="value">${new Date(booking.startTime || booking.start_time).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit'
              })}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Duration: ${(booking.duration || booking.durationHours || booking.duration_hours)} hour${(booking.duration || booking.durationHours || booking.duration_hours) > 1 ? 's' : ''}</div>
            </div>

            <div class="revenue">
              <div style="font-size: 16px; margin-bottom: 10px;">Your Earnings (80%)</div>
              <div class="revenue-amount">$${((booking.pricing?.subtotal || 0) * 0.80).toFixed(2)}</div>
              <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">Platform fee: $${(booking.pricing?.platformFee || 0).toFixed(2)} (20%)</div>
            </div>

            <div style="text-align: center;">
              <a href="http://92.112.184.224/apps/billboardbids/owner-dashboard.html" class="action-button">Review Creative & Approve</a>
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 14px;">
              ⏰ <strong>Action Required:</strong> Please review and approve the creative within 24 hours to keep the advertiser happy.
            </p>
          </div>
          <div class="footer">
            <p>BillboardBids - Helping you maximize billboard revenue</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(ownerEmail, subject, html);
  }

  // Creative approval notification to advertiser
  async sendCreativeApprovalNotification(booking, billboard, approved, notes = '') {
    const subject = approved 
      ? `✅ Creative Approved: ${billboard.name}`
      : `❌ Creative Rejected: ${billboard.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${approved ? '#10b981' : '#ef4444'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
          .label { font-weight: 600; color: #6b7280; font-size: 14px; }
          .value { font-size: 16px; color: #111827; margin-top: 5px; }
          .notes { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${approved ? '✅ Creative Approved!' : '❌ Creative Rejected'}</h1>
          </div>
          <div class="content">
            ${approved 
              ? `<p style="font-size: 16px;">Great news! Your creative has been approved and your ad will go live as scheduled.</p>`
              : `<p style="font-size: 16px;">Your creative has been rejected. Please review the feedback below and submit a revised version.</p>`
            }
            
            <div class="detail-row">
              <div class="label">CAMPAIGN</div>
              <div class="value">${booking.campaignName || booking.campaign_name}</div>
            </div>

            <div class="detail-row">
              <div class="label">BILLBOARD</div>
              <div class="value">${billboard.name}</div>
            </div>

            <div class="detail-row">
              <div class="label">SCHEDULED START</div>
              <div class="value">${new Date(booking.startTime || booking.start_time).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit'
              })}</div>
            </div>

            ${notes ? `
              <div class="notes">
                <strong>Feedback from owner:</strong>
                <p style="margin: 10px 0 0 0;">${notes}</p>
              </div>
            ` : ''}

            ${approved 
              ? `<p style="margin-top: 30px; padding: 15px; background: white; border-radius: 6px; font-size: 14px;">
                   Your ad is all set! It will automatically go live at the scheduled time. You'll receive a confirmation once it's running.
                 </p>`
              : `<p style="margin-top: 30px; padding: 15px; background: white; border-radius: 6px; font-size: 14px;">
                   Please upload a revised creative that addresses the feedback above. <a href="http://92.112.184.224/apps/billboardbids/">Upload new creative</a>
                 </p>`
            }
          </div>
          <div class="footer">
            <p>BillboardBids</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(booking.customerEmail || booking.advertiserEmail, subject, html);
  }

  // Welcome email for new billboard owners
  async sendOwnerWelcome(ownerEmail, ownerName, billboardCount = 1) {
    const subject = 'Welcome to BillboardBids! 🎉';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .benefit { padding: 15px; background: white; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
          .action-button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to BillboardBids!</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hi ${ownerName},</p>
            <p>Thanks for joining BillboardBids! Your ${billboardCount} billboard${billboardCount > 1 ? 's are' : ' is'} now listed and ready to start earning.</p>
            
            <h3 style="margin-top: 30px;">What happens next:</h3>
            
            <div class="benefit">
              <strong>📸 Bookings arrive automatically</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Advertisers can book your billboards 24/7. You'll get an email for each new booking.</p>
            </div>

            <div class="benefit">
              <strong>✅ Quick approval process</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Review creatives in your dashboard. Approve or reject with one click.</p>
            </div>

            <div class="benefit">
              <strong>💰 Instant payouts</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Get paid within 24 hours of campaign completion. Keep 70-85% of every booking.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://92.112.184.224/apps/billboardbids/owner-dashboard.html" class="action-button">Access Your Dashboard</a>
            </div>

            <h3 style="margin-top: 30px;">Tips to maximize revenue:</h3>
            <ul style="line-height: 2;">
              <li>Keep billboard photos updated and high-quality</li>
              <li>Respond to creative approvals within 24 hours</li>
              <li>Set competitive pricing (we recommend $50-150/hour)</li>
              <li>Enable rush scheduling for premium rates</li>
            </ul>

            <p style="margin-top: 30px; padding: 15px; background: white; border-radius: 6px; font-size: 14px;">
              <strong>Questions?</strong> Reply to this email or call us at (555) 123-4567. We're here to help!
            </p>
          </div>
          <div class="footer">
            <p>BillboardBids - Helping you maximize billboard revenue</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(ownerEmail, subject, html);
  }
}

// Export singleton instance
module.exports = new EmailService();
