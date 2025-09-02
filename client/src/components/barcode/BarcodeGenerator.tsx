import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  textAlign?: string;
  textPosition?: string;
  textMargin?: number;
  fontOptions?: string;
  font?: string;
  background?: string;
  lineColor?: string;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  value,
  format = "CODE128",
  width = 2,
  height = 100,
  displayValue = true,
  fontSize = 20,
  textAlign = "center",
  textPosition = "bottom",
  textMargin = 2,
  fontOptions = "",
  font = "monospace",
  background = "#ffffff",
  lineColor = "#000000",
  margin = 10,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          textAlign,
          textPosition,
          textMargin,
          fontOptions,
          font,
          background,
          lineColor,
          margin,
          marginTop: marginTop ?? margin,
          marginBottom: marginBottom ?? margin,
          marginLeft: marginLeft ?? margin,
          marginRight: marginRight ?? margin,
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [
    value,
    format,
    width,
    height,
    displayValue,
    fontSize,
    textAlign,
    textPosition,
    textMargin,
    fontOptions,
    font,
    background,
    lineColor,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
  ]);

  return <canvas ref={canvasRef} />;
};

export default BarcodeGenerator;