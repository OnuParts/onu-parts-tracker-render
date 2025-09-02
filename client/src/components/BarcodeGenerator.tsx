import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';

interface BarcodeProps {
  value: string;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  width?: number;
  height?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  onGenerated?: (canvas: HTMLCanvasElement) => void;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  displayValue = true,
  text,
  fontSize = 12,
  width = 2,
  height = 100,
  margin = 10,
  background = '#ffffff',
  lineColor = '#000000',
  onGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          displayValue,
          text: text || value,
          fontSize,
          width,
          height,
          margin,
          background,
          lineColor,
        });

        if (onGenerated && canvasRef.current) {
          onGenerated(canvasRef.current);
        }
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [value, displayValue, text, fontSize, width, height, margin, background, lineColor, onGenerated]);

  return <canvas ref={canvasRef} />;
};

interface PrintableBarcodeProps extends BarcodeProps {
  itemName?: string;
  printLabel?: string;
  onPrintComplete?: () => void;
}

export const PrintableBarcode: React.FC<PrintableBarcodeProps> = ({
  value,
  itemName,
  printLabel = 'Print Barcode',
  onPrintComplete,
  ...barcodeProps
}) => {
  const [isPrinting, setIsPrinting] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!value) return;
    
    setIsPrinting(true);
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print barcodes.');
      setIsPrinting(false);
      return;
    }
    
    // Create the document content
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${value}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .barcode-container {
              display: inline-block;
              text-align: center;
              margin: 10px;
              padding: 15px;
              border: 1px dashed #ccc;
              page-break-inside: avoid;
            }
            .barcode-name {
              margin-top: 8px;
              font-weight: bold;
              font-size: 14px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .barcode-container {
                border: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: center;">
            <h2>Print Barcode</h2>
            <p>Click the Print button below or use Ctrl+P to print</p>
            <button onclick="window.print(); setTimeout(() => window.close(), 500);" 
              style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print
            </button>
          </div>
          <div class="barcode-container">
            <div id="barcode-placeholder"></div>
            ${itemName ? `<div class="barcode-name">${itemName}</div>` : ''}
          </div>
        </body>
      </html>
    `);

    // Wait for the document to be ready
    printWindow.document.close();
    printWindow.onload = () => {
      // Create a canvas in the new window
      const canvas = document.createElement('canvas');
      const container = printWindow.document.getElementById('barcode-placeholder');
      if (container) {
        // Generate the barcode in this new canvas
        JsBarcode(canvas, value, {
          format: 'CODE128',
          displayValue: barcodeProps.displayValue !== false,
          text: barcodeProps.text || value,
          fontSize: barcodeProps.fontSize || 14,
          width: barcodeProps.width || 2, 
          height: barcodeProps.height || 100,
          margin: barcodeProps.margin || 10,
          background: barcodeProps.background || '#ffffff',
          lineColor: barcodeProps.lineColor || '#000000',
        });
        
        container.appendChild(canvas);
        
        // Setup close event to notify when printing is done
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
          setIsPrinting(false);
          if (onPrintComplete) onPrintComplete();
        });
        
        // If after 3 seconds the window is still open, reset the state
        setTimeout(() => {
          setIsPrinting(false);
          if (onPrintComplete) onPrintComplete();
        }, 3000);
      }
    };
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <div className="mb-2">
        <Barcode value={value} {...barcodeProps} />
      </div>
      <Button 
        onClick={handlePrint} 
        size="sm"
        variant="outline"
        disabled={isPrinting}
      >
        {isPrinting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Printing...
          </>
        ) : (
          <>
            <Printer className="mr-2 h-4 w-4" />
            {printLabel}
          </>
        )}
      </Button>
    </div>
  );
};

interface MultiBarcodeProps {
  items: Array<{
    value: string;
    name?: string;
  }>;
  title?: string;
  onPrintComplete?: () => void;
}

export const PrintMultipleBarcodes: React.FC<MultiBarcodeProps> = ({
  items,
  title = 'Print Barcodes',
  onPrintComplete,
}) => {
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handlePrint = () => {
    if (!items || items.length === 0) return;
    
    setIsPrinting(true);
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print barcodes.');
      setIsPrinting(false);
      return;
    }
    
    // Create the document content
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .page-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .barcodes-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-start;
            }
            .barcode-container {
              display: inline-block;
              text-align: center;
              margin: 10px;
              padding: 15px;
              border: 1px dashed #ccc;
              page-break-inside: avoid;
            }
            .barcode-name {
              margin-top: 8px;
              font-weight: bold;
              font-size: 14px;
            }
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
              .barcode-container {
                border: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print page-header">
            <h2>${title}</h2>
            <p>Click the Print button below or use Ctrl+P to print</p>
            <button onclick="window.print(); setTimeout(() => window.close(), 500);" 
              style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print
            </button>
          </div>
          <div class="barcodes-container">
            ${items.map(item => `
              <div class="barcode-container">
                <div id="barcode-placeholder-${item.value}"></div>
                ${item.name ? `<div class="barcode-name">${item.name}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);

    // Wait for the document to be ready
    printWindow.document.close();
    printWindow.onload = () => {
      // Generate each barcode
      items.forEach(item => {
        const canvas = document.createElement('canvas');
        const container = printWindow.document.getElementById(`barcode-placeholder-${item.value}`);
        if (container) {
          JsBarcode(canvas, item.value, {
            format: 'CODE128',
            displayValue: true,
            fontSize: 14,
            width: 2,
            height: 80,
            margin: 10,
          });
          container.appendChild(canvas);
        }
      });
      
      // Setup close event to notify when printing is done
      printWindow.addEventListener('afterprint', () => {
        printWindow.close();
        setIsPrinting(false);
        if (onPrintComplete) onPrintComplete();
      });
      
      // If after 3 seconds the window is still open, reset the state
      setTimeout(() => {
        setIsPrinting(false);
        if (onPrintComplete) onPrintComplete();
      }, 3000);
    };
  };

  return (
    <Button 
      onClick={handlePrint} 
      disabled={isPrinting || items.length === 0}
      className="w-full"
    >
      {isPrinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Printing {items.length} Barcodes...
        </>
      ) : (
        <>
          <Printer className="mr-2 h-4 w-4" />
          Print {items.length} Barcodes
        </>
      )}
    </Button>
  );
};