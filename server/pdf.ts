import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { PartsIssuanceWithDetails } from '../shared/schema';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

// Create a chart canvas for rendering charts
const width = 600;
const height = 300;
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: '#ffffff',
  plugins: {
    requireLegacy: ['chartjs-plugin-datalabels']
  }
});

// Function to generate a bar chart for parts issuance data
async function generatePartsIssuanceChart(
  issuances: PartsIssuanceWithDetails[]
): Promise<Buffer> {
  try {
    // Group data by technician
    const technicianCounts: Record<string, number> = {};
    
    issuances.forEach(issuance => {
      const technician = issuance.issuedTo || 'Unknown';
      if (!technicianCounts[technician]) {
        technicianCounts[technician] = 0;
      }
      technicianCounts[technician] += issuance.quantity;
    });
    
    // Sort technicians by quantity desc
    const sortedTechnicians = Object.entries(technicianCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7); // Top 7 technicians
    
    // Prepare chart data
    const labels = sortedTechnicians.map(([name]) => name);
    const data = sortedTechnicians.map(([_, count]) => count);
    
    // Set up the chart configuration
    const configuration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Parts Issued',
            data,
            backgroundColor: '#F36532', // ONU orange
            borderColor: '#E24D00',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Parts Issued by Technician',
            font: {
              size: 16,
            },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Technician',
            },
          },
        },
      },
    };
    
    // Render the chart and return it as a buffer
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error('Error generating parts issuance chart:', error);
    throw new Error('Failed to generate chart');
  }
}

// Function to generate a pie chart for cost distribution by department/building
async function generateCostDistributionChart(
  issuances: PartsIssuanceWithDetails[]
): Promise<Buffer> {
  try {
    // Group data by cost center
    const costCenterTotals: Record<string, number> = {};
    
    issuances.forEach(issuance => {
      const costCenter = issuance.costCenterName || issuance.costCenterCode || 'Unassigned';
      if (!costCenterTotals[costCenter]) {
        costCenterTotals[costCenter] = 0;
      }
      
      const unitCost = issuance.part?.unitCost || 0;
      const extendedCost = unitCost * issuance.quantity;
      costCenterTotals[costCenter] += extendedCost;
    });
    
    // Sort cost centers by total cost desc
    const sortedCostCenters = Object.entries(costCenterTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // Top 6 cost centers
    
    // Prepare chart data
    const labels = sortedCostCenters.map(([name]) => name);
    const data = sortedCostCenters.map(([_, total]) => total);
    
    // Set up the chart configuration
    const configuration = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#F36532', // ONU orange
              '#4B9CD3', // ONU blue
              '#F49A65',
              '#75B2DE',
              '#F7BE98',
              '#9EC8E8'
            ],
            borderColor: '#FFFFFF',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cost Distribution by Cost Center',
            font: {
              size: 16,
            },
          },
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw;
                return `$${value.toFixed(2)}`;
              },
            },
          },
        },
      },
    };
    
    // Render the chart and return it as a buffer
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error('Error generating cost distribution chart:', error);
    throw new Error('Failed to generate chart');
  }
}

/**
 * Generate PDF file from parts issuance data
 * FIXED VERSION: Addresses encoding issues and layout problems
 */
export async function generatePartsIssuancePDF(
  issuances: PartsIssuanceWithDetails[],
  month?: string
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Set up document in landscape orientation for better readability
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: 'landscape', // Use landscape orientation for better table readability
        margins: { top: 50, bottom: 50, left: 40, right: 40 },
        bufferPages: true,
        info: {
          Title: 'Parts Charge-Out Report',
          Author: 'Ohio Northern University',
          Subject: 'Monthly Parts Charge-Out Report',
        }
      });
      
      // Set up page numbering
      let pageCount = 0;
      doc.on('pageAdded', () => {
        pageCount++;
      });
      
      // Collect PDF data in memory buffer
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Calculate totals
      let grandTotal = 0;
      issuances.forEach(issuance => {
        const unitCost = issuance.part?.unitCost || 0;
        grandTotal += unitCost * issuance.quantity;
      });
      
      // Generate charts
      let barChartBuffer: Buffer | null = null;
      let pieChartBuffer: Buffer | null = null;
      
      try {
        if (issuances.length > 0) {
          barChartBuffer = await generatePartsIssuanceChart(issuances);
          pieChartBuffer = await generateCostDistributionChart(issuances);
        }
      } catch (error) {
        console.error('Error generating charts:', error);
        // Continue without charts if there's an error
      }
      
      // Add header
      const headerText = 'Ohio Northern University';
      doc.fontSize(16)
         .fillColor('#F36532') // ONU Orange
         .font('Helvetica-Bold')
         .text(headerText, { align: 'center' });
         
      doc.fontSize(14)
         .fillColor('#000000')
         .text('Physical Plant Parts Charge-Out Report', { align: 'center' });
         
      // Add report period if month is provided
      if (month) {
        const [monthNum, year] = month.split('/');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
          .toLocaleString('default', { month: 'long' });
        doc.fontSize(12)
           .text(`Report Period: ${monthName} ${year}`, { align: 'center' });
      }
      
      doc.moveDown(0.5);
      
      // Add summary section
      doc.fontSize(12)
         .fillColor('#333333')
         .font('Helvetica-Bold')
         .text('Summary', { underline: true });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Total Records: ${issuances.length}`);
      
      doc.text(`Total Cost: $${grandTotal.toFixed(2)}`);
      
      doc.moveDown(0.5);
      
      // Add charts if available - adjusted for landscape with better page management
      if (barChartBuffer) {
        try {
          doc.image(barChartBuffer, {
            fit: [500, 180], // Slightly smaller to prevent page overflow
            align: 'center',
          });
          doc.moveDown(0.3); // Reduced space
        } catch (err) {
          console.error('Error adding bar chart to PDF:', err);
        }
      }
      
      if (pieChartBuffer) {
        try {
          // Check if we have enough space for the second chart
          const remainingSpace = doc.page.height - doc.y;
          
          // If we don't have enough space for the chart, let's add it to the next page
          if (remainingSpace < 200) {
            doc.addPage();
          }
          
          doc.image(pieChartBuffer, {
            fit: [500, 180], // Slightly smaller to prevent page overflow
            align: 'center',
          });
          doc.moveDown(0.3); // Reduced space
        } catch (err) {
          console.error('Error adding pie chart to PDF:', err);
        }
      }
      
      // Add detailed table
      doc.addPage();
      
      doc.fontSize(12)
         .fillColor('#333333')
         .font('Helvetica-Bold')
         .text('Detailed Charge-Out Records', { underline: true });
      
      doc.moveDown(0.5);
      
      // FIXED: Improved column widths for better readability
      const startX = 30;
      const colWidths = [60, 60, 120, 50, 30, 60, 90, 90, 80]; 
      
      // Table headers
      const headerY = doc.y;
      doc.fontSize(9)
         .font('Helvetica-Bold');
         
      // Draw simple table headers all on one line to ensure proper alignment
      doc.text('Date', startX, headerY);
      doc.text('Part ID', startX + colWidths[0], headerY);
      doc.text('Part Name', startX + colWidths[0] + colWidths[1], headerY);
      doc.text('Unit Cost', startX + colWidths[0] + colWidths[1] + colWidths[2], headerY);
      doc.text('Qty', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerY);
      doc.text('Extended', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], headerY);
      doc.text('Technician', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], headerY);
      doc.text('Building', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], headerY);
      doc.text('Cost Center', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], headerY);
      
      // Draw header line
      doc.moveTo(startX, headerY + 15)
         .lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), headerY + 15)
         .stroke();
      
      doc.moveDown(1.5);
      
      // FIXED: Clean and sanitize text data to prevent encoding issues
      const sanitizeText = (text: string | null | undefined): string => {
        if (!text) return '';
        // Remove or replace problematic characters
        return text.replace(/[^\x20-\x7E]/g, ' ').trim();
      };
      
      // Table rows - use a fixed row height
      doc.font('Helvetica');
      let runningTotal = 0;
      const rowHeight = 20; // Fixed height for consistency
      
      issuances.forEach((issuance, index) => {
        // Check if we need a new page - leave space for headers
        if (doc.y > 510) {
          doc.addPage();
          
          // Repeat headers on new page with consistent positioning
          const newHeaderY = 70;
          doc.fontSize(9)
             .font('Helvetica-Bold');
          
          doc.text('Date', startX, newHeaderY);
          doc.text('Part ID', startX + colWidths[0], newHeaderY);
          doc.text('Part Name', startX + colWidths[0] + colWidths[1], newHeaderY);
          doc.text('Unit Cost', startX + colWidths[0] + colWidths[1] + colWidths[2], newHeaderY);
          doc.text('Qty', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], newHeaderY);
          doc.text('Extended', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], newHeaderY);
          doc.text('Technician', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], newHeaderY);
          doc.text('Building', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], newHeaderY);
          doc.text('Cost Center', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], newHeaderY);
          
          // Draw header line
          doc.moveTo(startX, newHeaderY + 15)
             .lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), newHeaderY + 15)
             .stroke();
          
          doc.moveDown(2);
          doc.font('Helvetica');
        }
        
        // Format date
        const date = new Date(issuance.issuedAt).toLocaleDateString();
        
        // Calculate extended price
        const unitCost = issuance.part?.unitCost || 0;
        const extendedPrice = unitCost * issuance.quantity;
        runningTotal += extendedPrice;
        
        const rowY = doc.y;
        
        // Sanitize and truncate part name
        const partName = issuance.part?.name || '';
        const sanitizedName = sanitizeText(partName);
        const truncatedName = sanitizedName.length > 25 ? sanitizedName.substring(0, 25) + '...' : sanitizedName;
        
        // Process building data
        const buildingDisplay = sanitizeText(issuance.buildingName || issuance.building || '');
        
        // Process cost center - ONLY show the numerical code
        let costCenterDisplay = '';
        if (issuance.costCenterCode) {
          costCenterDisplay = sanitizeText(issuance.costCenterCode);
        } else if (issuance.projectCode) {
          costCenterDisplay = sanitizeText(issuance.projectCode);
        }
        
        // Alternate row background
        if (index % 2 === 1) {
          doc.rect(startX, rowY, colWidths.reduce((sum, w) => sum + w, 0), rowHeight)
             .fill('#f5f5f5');
        }
        
        // Draw each cell carefully with consistent positioning
        doc.fillColor('#000000')
           .fontSize(8) // Smaller font for better fit
           .text(date, startX, rowY + 2, { width: colWidths[0] - 5 }); // +2 for vertical centering
           
        doc.text(sanitizeText(issuance.part?.partId || ''), 
                 startX + colWidths[0], rowY + 2, 
                 { width: colWidths[1] - 5 });
                 
        doc.text(truncatedName, 
                 startX + colWidths[0] + colWidths[1], rowY + 2, 
                 { width: colWidths[2] - 5 });
                 
        doc.text(unitCost ? `$${parseFloat(unitCost.toString()).toFixed(2)}` : '', 
                 startX + colWidths[0] + colWidths[1] + colWidths[2], rowY + 2, 
                 { width: colWidths[3] - 5 });
                 
        doc.text(issuance.quantity.toString(), 
                 startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowY + 2, 
                 { width: colWidths[4] - 5 });
                 
        doc.text(`$${extendedPrice.toFixed(2)}`, 
                 startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], rowY + 2, 
                 { width: colWidths[5] - 5 });
                 
        doc.text(sanitizeText(issuance.issuedTo || ''), 
                 startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], rowY + 2, 
                 { width: colWidths[6] - 5 });
                 
        doc.text(buildingDisplay, 
                 startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], rowY + 2, 
                 { width: colWidths[7] - 5 });
                 
        doc.text(costCenterDisplay, 
                 startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], rowY + 2, 
                 { width: colWidths[8] - 5 });
        
        // Move to next row with fixed height
        doc.moveDown(1);
      });
      
      // Draw total line
      doc.moveTo(startX, doc.y)
         .lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), doc.y)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Add grand total
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text('Grand Total:', startX + colWidths[0] + colWidths[1], doc.y);
      doc.text(`$${grandTotal.toFixed(2)}`, 
               startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], doc.y - 12);
      
      // Get the current page range but we'll use our adjusted count for display
      const pageRange = doc.bufferedPageRange();
      
      // Calculate the actual page count (skipping blank pages)
      const adjustedPageCount = Math.ceil(pageRange.count / 2);
      
      // Add page numbers only to visible pages (even numbered pages in buffer)
      for (let i = 0; i < pageRange.count; i += 2) {
        doc.switchToPage(i);
        
        // Add footer with page number - using proper count
        const pageNum = (i / 2) + 1;
        const text = `Page ${pageNum} of ${adjustedPageCount}`;
        const textWidth = doc.widthOfString(text);
        
        // Position the footer higher to avoid blank page creation
        const footerY = doc.page.height - 30;
        
        doc.fontSize(8)
           .fillColor('#555555')
           .text(
             text,
             doc.page.width - textWidth - 50,
             footerY,
             { lineBreak: false } // Prevent automatic page creation
           );
      }
      
      // Final logging for debugging
      console.log(`PDF completed with ${adjustedPageCount} adjusted pages`);
      
      // Finalize the PDF and end the stream
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error('Failed to generate PDF'));
    }
  });
}