import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, RefreshCw, Smartphone, Monitor } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SignatureConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: number;
  staffName: string;
  partName: string;
  quantity: number;
  onSuccess: () => void;
};

const SignatureConfirmationDialog = ({
  open,
  onOpenChange,
  deliveryId,
  staffName,
  partName,
  quantity,
  onSuccess,
}: SignatureConfirmationDialogProps) => {
  const [mode, setMode] = useState<"signature" | "desktop">("signature");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if running on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    };
    
    setIsMobile(checkMobile());
    // Default to desktop mode on non-mobile devices
    if (!checkMobile()) {
      setMode("desktop");
    }
  }, []);

  // Setup canvas for signature when in signature mode
  useEffect(() => {
    if (!open || mode !== "signature" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    
    // Adjust canvas size
    const resizeCanvas = () => {
      const parentWidth = canvas.parentElement?.clientWidth ?? 300;
      canvas.width = parentWidth;
      canvas.height = 250;
      
      // Refill background after resize
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [open, mode]);

  // Clear the signature pad
  const handleClear = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Start drawing on mouse down or touch start
  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  // Draw line on mouse move or touch move
  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  // Stop drawing on mouse up or touch end
  const handleStopDrawing = () => {
    isDrawing.current = false;
    
    // Save signature as base64 image
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL("image/png"));
    }
  };

  // Helper to get coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    
    if (!canvas) {
      return { offsetX: 0, offsetY: 0 };
    }
    
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
  };

  // Handle confirmation submission
  const handleConfirm = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/parts-delivery/${deliveryId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: mode === "signature" ? signatureData : null,
          bypassSignature: mode === "desktop",
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to confirm delivery");
      }
      
      toast({
        title: "Delivery confirmed",
        description: "The delivery has been confirmed successfully",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({
        title: "Error confirming delivery",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>
            Confirm the delivery of {quantity} {quantity === 1 ? "unit" : "units"} of {partName} to {staffName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex space-x-2">
            <Button
              onClick={() => setMode("signature")}
              size="sm"
              variant={mode === "signature" ? "default" : "outline"}
              className="flex-1"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Signature
            </Button>
            <Button
              onClick={() => setMode("desktop")}
              size="sm"
              className="flex-1"
              variant={mode === "desktop" ? "default" : "outline"}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
          </div>

          {mode === "signature" ? (
            <div>
              <div className="border rounded-md mb-2">
                <canvas
                  ref={canvasRef}
                  className="w-full touch-none"
                  onMouseDown={handleStartDrawing}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDrawing}
                  onMouseLeave={handleStopDrawing}
                  onTouchStart={handleStartDrawing}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleStopDrawing}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleClear}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Signature
              </Button>
            </div>
          ) : (
            <div className="border rounded-md p-4 text-center text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Desktop confirmation doesn't require a signature.</p>
              <p className="text-sm mt-1">
                Click confirm below to mark item as delivered.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={mode === "signature" && !signatureData || isSubmitting}
          >
            {isSubmitting ? "Confirming..." : "Confirm Delivery"}
            {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureConfirmationDialog;