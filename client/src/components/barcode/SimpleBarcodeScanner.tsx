import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Camera } from "lucide-react";

interface SimpleBarcodeProps {
  onCodeDetected: (code: string) => void;
  onClose: () => void;
}

export function SimpleBarcodeScanner({ onCodeDetected, onClose }: SimpleBarcodeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      console.log("Starting camera stream...");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
        console.log("Camera started successfully");
      }
    } catch (error) {
      console.error("Camera error:", error);
      // Fallback to manual entry
      const barcode = prompt("Camera not available. Please enter barcode manually:");
      if (barcode) {
        onCodeDetected(barcode);
        onClose();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualEntry = () => {
    const barcode = prompt("Enter barcode manually:");
    if (barcode) {
      onCodeDetected(barcode);
      onClose();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Barcode Scanner
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-md"
            autoPlay
            playsInline
            muted
          />
          
          {isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-red-500 w-48 h-32 bg-transparent opacity-60"></div>
            </div>
          )}
          
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
              <div className="text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm text-gray-500">Starting camera...</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleManualEntry} variant="outline" className="flex-1">
            Enter Manually
          </Button>
          <Button onClick={() => { stopCamera(); onClose(); }} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground">
          Point camera at barcode, then enter the code manually when prompted
        </div>
      </CardContent>
    </Card>
  );
}