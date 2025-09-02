import { 
  StaffMemberWithRelations, 
  PartsDeliveryWithDetails 
} from '@shared/schema';

// Store receipts in memory for download
export const deliveryReceipts: { [deliveryId: string]: string } = {};

// Generate downloadable receipt instead of sending email
export async function generateDeliveryReceipt(
  delivery: PartsDeliveryWithDetails,
  staffEmail: string
): Promise<boolean> {
  try {
    console.log(`📄 GENERATING DOWNLOADABLE RECEIPT for delivery ${delivery.id}`);
    console.log(`   🎯 Staff: ${delivery.staffMember.name} (${staffEmail})`);
    console.log(`   📦 Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
    
    // Generate professional receipt HTML
    const receiptContent = generateReceiptHTML(delivery, staffEmail);
    
    // Store receipt for download
    deliveryReceipts[delivery.id] = receiptContent;
    
    console.log(`✅ RECEIPT GENERATED SUCCESSFULLY for delivery ${delivery.id}`);
    console.log(`   📄 Receipt ready for download and manual forwarding`);
    console.log(`   🔗 Available at: /api/parts-delivery/${delivery.id}/receipt`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate receipt for delivery ${delivery.id}:`, error);
    return false;
  }
}

function generateReceiptHTML(
  delivery: PartsDeliveryWithDetails,
  staffEmail: string
): string {
  const deliveryDate = delivery.deliveredAt 
    ? new Date(delivery.deliveredAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      })
    : 'Not specified';

  const unitCost = typeof delivery.unitCost === 'string' 
    ? parseFloat(delivery.unitCost) 
    : delivery.unitCost || 0;
    
  const totalCost = unitCost * delivery.quantity;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Parts Delivery Confirmation - ${delivery.part?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #003366; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header h2 { margin: 10px 0 0 0; font-size: 18px; font-weight: normal; }
          .content { padding: 30px; }
          .delivery-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #333; }
          .value { color: #666; }
          .total-row { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .total-row .detail-row { margin: 5px 0; border: none; }
          .success { color: #28a745; font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          .next-steps { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .print-friendly { display: none; }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .print-friendly { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 ONU Parts Tracker</h1>
            <h2>Parts Delivery Confirmation</h2>
          </div>
          
          <div class="content">
            <p class="success">✅ Parts Delivery Confirmed Successfully</p>
            
            <div class="delivery-info">
              <h3 style="margin-top: 0;">Delivery Details</h3>
              <div class="detail-row">
                <span class="label">Recipient:</span>
                <span class="value">${delivery.staffMember.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${staffEmail}</span>
              </div>
              <div class="detail-row">
                <span class="label">Building:</span>
                <span class="value">${delivery.building?.name || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Cost Center:</span>
                <span class="value">${delivery.costCenter?.code || 'Not specified'} - ${delivery.costCenter?.name || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Delivery Date:</span>
                <span class="value">${deliveryDate}</span>
              </div>
            </div>

            <div class="delivery-info">
              <h3 style="margin-top: 0;">Part Information</h3>
              <div class="detail-row">
                <span class="label">Part Name:</span>
                <span class="value">${delivery.part?.name || 'Unknown Part'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Part Number:</span>
                <span class="value">${delivery.part?.partId || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity Delivered:</span>
                <span class="value">${delivery.quantity}</span>
              </div>
              <div class="detail-row">
                <span class="label">Unit Cost:</span>
                <span class="value">$${unitCost.toFixed(2)}</span>
              </div>
            </div>

            <div class="total-row">
              <div class="detail-row">
                <span class="label" style="font-size: 16px;">Total Cost:</span>
                <span class="value" style="font-size: 16px; font-weight: bold; color: #003366;">$${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div class="next-steps">
              <h4 style="margin-top: 0;">📧 Next Steps:</h4>
              <p><strong>This receipt is ready for forwarding!</strong> You can:</p>
              <ul>
                <li>Print this receipt for physical records</li>
                <li>Forward this email to the staff member</li>
                <li>Save as PDF for your files</li>
                <li>Include in cost center reporting</li>
              </ul>
            </div>
            
            ${delivery.notes ? `
              <div class="delivery-info">
                <h3 style="margin-top: 0;">Additional Notes</h3>
                <p style="margin: 0;">${delivery.notes}</p>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>ONU Parts Tracker - Automated Delivery Confirmation System</p>
            <p>Generated on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} (Eastern Time)</p>
          </div>
        </div>
      </body>
    </html>
  `;
}