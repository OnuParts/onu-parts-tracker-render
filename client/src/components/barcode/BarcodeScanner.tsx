import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, AlertTriangle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onCodeDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onCodeDetected, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{id: string, label: string}[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize the scanner when component mounts
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        console.log("Initializing barcode scanner...");
        
        // Ensure DOM element exists
        const scannerElement = document.getElementById('scanner-container');
        if (!scannerElement) {
          console.error("Scanner container element not found");
          setError("Scanner container not ready. Please try again.");
          return;
        }
        
        // Get available cameras first
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);
        
        if (devices && devices.length) {
          setAvailableCameras(devices);
          
          // Select a camera (prefer back/rear camera if available)
          const rearCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          const cameraId = rearCamera ? rearCamera.id : devices[0].id;
          setSelectedCamera(cameraId);
          
          // Create scanner instance AFTER we have cameras and DOM element
          scannerRef.current = new Html5Qrcode('scanner-container');
          console.log("Scanner created successfully with camera:", cameraId);
          
          // Auto-start scanning with a small delay
          setTimeout(() => {
            setIsScanning(true);
          }, 300);
          
        } else {
          setError("No cameras found on your device. Please ensure camera permissions are granted.");
        }
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        setError(`Camera access error: ${err.message || String(err)}. Please check browser permissions.`);
      }
    };
    
    // Longer delay to ensure DOM is completely ready, especially on mobile
    const timer = setTimeout(initializeScanner, 500);
    
    // Clean up on unmount
    return () => {
      clearTimeout(timer);
      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(e => console.error("Error stopping scanner:", e));
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    };
  }, []);

  // Handle starting/stopping scanning
  useEffect(() => {
    if (!scannerRef.current || !selectedCamera) return;
    
    if (isScanning) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [0, 1] // Both QR codes and barcodes
      };
      
      scannerRef.current.start(
        selectedCamera,
        config,
        (decodedText) => {
          console.log("Code detected:", decodedText);
          
          // Call the callback immediately
          onCodeDetected(decodedText);
          
          // Stop scanning after detection
          setIsScanning(false);
          
          // Close the scanner after successful scan
          onClose();
        },
        (errorMessage) => {
          // This is called for each non-decodable frame - don't log for performance
        }
      ).catch(err => {
        console.error("Error starting scanner:", err);
        setError(`Scanner error: ${err.message || String(err)}`);
        setIsScanning(false);
      });
    } else {
      // Stop scanning if it's active
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          console.error("Error stopping scanner:", err);
        });
      }
    }
  }, [isScanning, selectedCamera, onCodeDetected, onClose]);

  // Handle camera selection change
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = e.target.value;
    
    // Stop current scanning if active
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => {
        console.error("Error stopping scanner:", err);
      });
      setIsScanning(false);
    }
    
    setSelectedCamera(newCameraId);
  };

  // Handle file upload for barcode scanning
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (scannerRef.current) {
        const result = await scannerRef.current.scanFile(file, true);
        onCodeDetected(result);
        onClose();
      }
    } catch (error) {
      console.error('File scan error:', error);
      setError('Could not read barcode from image. Please try a different image or use camera scanning.');
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Scan Barcode</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <p className="mt-2 text-xs">
                Please close this dialog and enter the Part ID manually in the field.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Camera selection */}
        {availableCameras.length > 1 && !error && (
          <div className="mb-4">
            <label htmlFor="camera-select" className="block text-sm font-medium mb-1">
              Select Camera
            </label>
            <select
              id="camera-select"
              className="w-full p-2 border rounded-md"
              value={selectedCamera || ''}
              onChange={handleCameraChange}
            >
              {availableCameras.map(camera => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || camera.id}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Scanner container */}
        {!error && (
          <div 
            id="scanner-container" 
            ref={containerRef}
            className="w-full h-[250px] bg-muted rounded-md overflow-hidden flex items-center justify-center"
          >
            {!isScanning && (
              <div className="text-center text-muted-foreground">
                Click "Start Scanning" to activate camera
              </div>
            )}
          </div>
        )}
        
        {/* File upload fallback */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Alternative: Upload barcode image</h4>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="barcode-file-input"
            ref={fileInputRef}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        {!error && (
          <Button 
            onClick={() => setIsScanning(!isScanning)}
            disabled={!selectedCamera}
            className="w-full"
          >
            <Camera className="mr-2 h-4 w-4" />
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
        )}
        {error && (
          <Button 
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}