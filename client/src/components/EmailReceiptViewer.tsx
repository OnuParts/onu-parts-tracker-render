import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Download, PrinterIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailReceiptViewerProps {
  deliveryId: string;
  staffName?: string;
}

export function EmailReceiptViewer({ deliveryId, staffName }: EmailReceiptViewerProps) {
  const [emailContent, setEmailContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchEmailReceipt = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/email-receipt/${deliveryId}`);
      if (response.ok) {
        const content = await response.text();
        setEmailContent(content);
      } else {
        toast({
          title: 'No Email Receipt',
          description: 'Email receipt not available for this delivery.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email receipt.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchEmailReceipt();
  };

  const handlePrint = () => {
    if (emailContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(emailContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (emailContent) {
      const blob = new Blob([emailContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-receipt-delivery-${deliveryId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleOpen}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          View Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Email Receipt - Delivery #{deliveryId}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                disabled={!emailContent}
                className="gap-2"
              >
                <PrinterIcon className="h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={!emailContent}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading email receipt...</p>
              </div>
            </div>
          ) : emailContent ? (
            <iframe
              srcDoc={emailContent}
              className="w-full h-96"
              style={{ minHeight: '400px' }}
              title={`Email receipt for delivery ${deliveryId}`}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No email receipt available</p>
                <p className="text-sm">The receipt may not have been generated yet.</p>
              </div>
            </div>
          )}
        </div>
        
        {staffName && (
          <p className="text-sm text-gray-600 mt-2">
            Email sent to: <strong>{staffName}</strong>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}