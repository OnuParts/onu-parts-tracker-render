// Bulk Email Service - Automatic delivery receipt system
import { PartsDeliveryWithDetails } from './delivery-routes';

// In-memory queue for pending delivery emails
const pendingDeliveries: { [staffEmail: string]: PartsDeliveryWithDetails[] } = {};

export function queueDeliveryForBulkEmail(delivery: PartsDeliveryWithDetails, staffEmail: string) {
  if (!pendingDeliveries[staffEmail]) {
    pendingDeliveries[staffEmail] = [];
  }
  pendingDeliveries[staffEmail].push(delivery);
  console.log(`📬 QUEUED delivery ${delivery.id} for bulk email to ${staffEmail}`);
  console.log(`   📦 Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
  console.log(`   📋 Total pending for ${staffEmail}: ${pendingDeliveries[staffEmail].length}`);
}

export async function sendBulkDeliveryEmails() {
  const staffEmails = Object.keys(pendingDeliveries);
  
  if (staffEmails.length === 0) {
    return; // Nothing to send
  }

  console.log(`📧 BULK EMAIL BATCH: Processing ${staffEmails.length} staff members`);

  for (const staffEmail of staffEmails) {
    const deliveries = pendingDeliveries[staffEmail];
    const staffName = deliveries[0]?.staffMember?.name || 'Unknown Staff';
    
    try {
      await sendEmailViaSendGrid(staffEmail, staffName, deliveries);
      
      // Clear the queue for this staff member
      delete pendingDeliveries[staffEmail];
      console.log(`✅ BULK EMAIL SUCCESS: Sent and cleared ${deliveries.length} deliveries for ${staffEmail}`);
    } catch (error) {
      console.log(`❌ BULK EMAIL FAILED for ${staffEmail}: ${error.message}`);
    }
  }
}

async function sendEmailViaSendGrid(staffEmail: string, staffName: string, deliveries: PartsDeliveryWithDetails[]) {
  const totalValue = deliveries.reduce((sum, d) => {
    const unitCost = typeof d.unitCost === 'string' ? parseFloat(d.unitCost) : d.unitCost || 0;
    return sum + (unitCost * d.quantity);
  }, 0);

  // Use ONU SMTP directly - no external services needed
  const nodemailer = await import('nodemailer');
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });

    const emailContent = generateConsolidatedEmailHTML(staffName, deliveries, totalValue);
    
    await transporter.sendMail({
      from: `"ONU Parts Tracker" <${process.env.GMAIL_USER}>`,
      to: staffEmail,
      subject: `Parts Delivery Summary - ${deliveries.length} Items Delivered`,
      html: emailContent,
      text: `Parts Delivery Summary: ${deliveries.length} items delivered to ${staffName}. Total value: $${totalValue.toFixed(2)}`
    });
    
    console.log(`✅ ONU SMTP EMAIL SENT to ${staffEmail} - ${deliveries.length} items, $${totalValue.toFixed(2)}`);
    
  } catch (error) {
    console.log(`❌ ONU SMTP ERROR: ${error.message}`);
    throw error;
  }
}

function generateConsolidatedEmailHTML(staffName: string, deliveries: PartsDeliveryWithDetails[], totalValue: number): string {
  const deliveryDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  });

  const deliveryRows = deliveries.map(delivery => {
    const unitCost = typeof delivery.unitCost === 'string' ? parseFloat(delivery.unitCost) : delivery.unitCost || 0;
    const itemTotal = unitCost * delivery.quantity;
    
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${delivery.part?.name || 'Unknown'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${delivery.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${unitCost.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Parts Delivery Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #003366; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .summary { background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .delivery-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .delivery-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
          .total-row { background: #fff3cd; font-weight: bold; }
          .total-row td { padding: 12px; border-top: 2px solid #ffc107; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 ONU Parts Tracker</h1>
            <h2>Parts Delivery Summary</h2>
          </div>
          <div class="content">
            <div class="summary">
              <h3>📋 Delivery Details</h3>
              <p><strong>Recipient:</strong> ${staffName}</p>
              <p><strong>Date:</strong> ${deliveryDate}</p>
              <p><strong>Items Delivered:</strong> ${deliveries.length}</p>
              <p><strong>Total Value:</strong> $${totalValue.toFixed(2)}</p>
            </div>

            <table class="delivery-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Cost</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${deliveryRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;"><strong>Grand Total:</strong></td>
                  <td style="text-align: right;"><strong>$${totalValue.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0;"><strong>📧 Automated Email Receipt</strong></p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                This is an automated confirmation of your parts delivery. For questions, contact the Parts Management team.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>Ohio Northern University - Parts Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Initialize bulk email sending (called every 30 seconds for testing)
export function initializeBulkEmailSystem() {
  console.log('🚀 BULK EMAIL SYSTEM: Initializing ONU SMTP batch processing');
  
  // Send bulk emails every 30 seconds for testing
  setInterval(async () => {
    try {
      await sendBulkDeliveryEmails();
    } catch (error) {
      console.error('Bulk email system error:', error);
    }
  }, 30 * 1000); // 30 seconds for faster testing

  console.log('✅ BULK EMAIL SYSTEM: ONU SMTP batch processing active (30-second intervals)');
  
  // Test email functionality disabled to prevent daily duplicate emails
  console.log('📧 Test email functionality disabled - no automatic test emails will be sent');
}