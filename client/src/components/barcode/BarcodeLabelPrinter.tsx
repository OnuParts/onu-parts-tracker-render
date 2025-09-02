import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, Search, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarcodeGenerator } from './BarcodeGenerator';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import type { Part, StorageLocation } from '@shared/schema';

interface BarcodeLabelPrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeLabelPrinter({ open, onOpenChange }: BarcodeLabelPrinterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());
  const [labelSize, setLabelSize] = useState<'avery5160' | 'small' | 'medium' | 'large'>('avery5160');
  const [includeDescription, setIncludeDescription] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeQuantity, setIncludeQuantity] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch parts data
  const { data: parts = [], isLoading: partsLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
  });

  // Fetch storage locations
  const { data: locations = [] } = useQuery<StorageLocation[]>({
    queryKey: ['/api/storage-locations'],
  });

  // Filter parts based on search and filters
  const filteredParts = parts.filter(part => {
    const matchesSearch = searchTerm === '' || 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.description && part.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'all' || 
      (part.locationId && part.locationId.toString() === selectedLocation) ||
      (part.location && part.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      (part.category && part.category === selectedCategory);
    
    return matchesSearch && matchesLocation && matchesCategory;
  });

  // Get unique categories (filter out null/undefined)
  const categories = Array.from(new Set(parts.map(part => part.category).filter((category): category is string => Boolean(category))));

  const handleSelectAll = () => {
    const allPartIds = new Set(filteredParts.map(part => part.id));
    setSelectedParts(allPartIds);
  };

  const handleClearAll = () => {
    setSelectedParts(new Set());
  };

  const togglePartSelection = (partId: number) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
    } else {
      newSelected.add(partId);
    }
    setSelectedParts(newSelected);
  };

  const generatePDF = () => {
    const selectedPartsData = parts.filter(part => selectedParts.has(part.id));
    
    if (selectedPartsData.length === 0) {
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Label dimensions based on size - Avery 5160 exact specifications
    const labelDimensions = {
      avery5160: { 
        width: 66.675,  // 2.625 inches = 66.675mm
        height: 25.4,   // 1 inch = 25.4mm
        labelsPerRow: 3,
        labelsPerColumn: 10,
        marginTop: 12.7,    // 0.5 inch = 12.7mm
        marginLeft: 4.7625, // 0.1875 inch = 4.7625mm (Avery 5160 left margin)
        horizontalSpacing: 3.175, // 0.125 inch = 3.175mm between labels
        verticalSpacing: 0        // No vertical spacing for Avery 5160
      },
      small: { width: 80, height: 40 },
      medium: { width: 100, height: 50 },
      large: { width: 120, height: 60 }
    };
    
    let labelWidth, labelHeight, labelsPerRow, labelsPerColumn, marginTop, marginLeft, horizontalSpacing, verticalSpacing;
    
    if (labelSize === 'avery5160') {
      const avery = labelDimensions.avery5160;
      labelWidth = avery.width;
      labelHeight = avery.height;
      labelsPerRow = avery.labelsPerRow;
      labelsPerColumn = avery.labelsPerColumn;
      marginTop = avery.marginTop;
      marginLeft = avery.marginLeft;
      horizontalSpacing = avery.horizontalSpacing;
      verticalSpacing = avery.verticalSpacing;
    } else {
      const { width, height } = labelDimensions[labelSize];
      labelWidth = width;
      labelHeight = height;
      const margin = 10;
      marginTop = margin;
      marginLeft = margin;
      horizontalSpacing = 0;
      verticalSpacing = 0;
      labelsPerRow = Math.floor((pageWidth - 2 * margin) / labelWidth);
      labelsPerColumn = Math.floor((pageHeight - 2 * margin) / labelHeight);
    }
    
    const labelsPerPage = labelsPerRow * labelsPerColumn;
    
    let currentPage = 0;
    let labelIndex = 0;
    
    selectedPartsData.forEach((part, index) => {
      if (index % labelsPerPage === 0) {
        if (currentPage > 0) {
          pdf.addPage();
        }
        currentPage++;
        labelIndex = 0;
      }
      
      const row = Math.floor(labelIndex / labelsPerRow);
      const col = labelIndex % labelsPerRow;
      
      let x, y;
      if (labelSize === 'avery5160') {
        // Avery 5160 exact positioning - 3 columns, 10 rows
        x = marginLeft + col * (labelWidth + horizontalSpacing);
        y = marginTop + row * labelHeight; // No vertical spacing for Avery 5160
      } else {
        // Generic positioning for other sizes
        x = marginLeft + col * labelWidth;
        y = marginTop + row * labelHeight;
      }
      
      // Draw label border
      pdf.rect(x, y, labelWidth, labelHeight);
      
      // Generate actual barcode using JsBarcode
      const canvas = document.createElement('canvas');
      try {
        // Optimize barcode settings for Avery 5160 - smaller, precise fit
        const barcodeSettings = labelSize === 'avery5160' ? {
          format: "CODE128",
          width: 1.2,    // Narrower bars for small label
          height: 20,    // Shorter height to fit 1-inch label
          displayValue: false,
          margin: 1,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 2,
          marginRight: 2
        } : {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 10,
          marginTop: 5,
          marginBottom: 5,
          marginLeft: 20,
          marginRight: 20
        };
        
        JsBarcode(canvas, part.partId, barcodeSettings);
        
        // Convert canvas to image and add to PDF (centered) - Avery 5160 precise sizing
        const imgData = canvas.toDataURL('image/png');
        const barcodeWidth = labelSize === 'avery5160' ? labelWidth * 0.9 : labelWidth * 0.8;
        const barcodeHeight = labelSize === 'avery5160' ? 5 : 8; // Smaller height for Avery 5160
        const barcodeX = x + (labelWidth - barcodeWidth) / 2; // Center horizontally
        const barcodeY = y + (labelSize === 'avery5160' ? 1.5 : 3); // Tighter spacing for Avery 5160
        
        pdf.addImage(imgData, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
        
        // Add part ID text below barcode (centered) - smaller font for Avery 5160
        pdf.setFontSize(labelSize === 'avery5160' ? 6 : 8);
        const partIdWidth = pdf.getTextWidth(part.partId);
        pdf.text(part.partId, x + (labelWidth - partIdWidth) / 2, barcodeY + barcodeHeight + (labelSize === 'avery5160' ? 1.5 : 2));
        
      } catch (error) {
        console.error('Barcode generation failed:', error);
        // Fallback: add part ID as text (centered)
        pdf.setFontSize(10);
        const partIdWidth = pdf.getTextWidth(part.partId);
        pdf.text(part.partId, x + (labelWidth - partIdWidth) / 2, y + 10);
      }
      
      // Add part name (centered) - very compact for Avery 5160
      const partNameFontSize = labelSize === 'avery5160' ? 5 : 9;
      const maxPartNameLength = labelSize === 'avery5160' ? 20 : 20;
      pdf.setFontSize(partNameFontSize);
      const partName = part.name && part.name.length > maxPartNameLength ? part.name.substring(0, maxPartNameLength) + '...' : (part.name || '');
      const partNameWidth = pdf.getTextWidth(partName);
      const partNameY = labelSize === 'avery5160' ? y + 12 : y + 18;
      pdf.text(partName, x + (labelWidth - partNameWidth) / 2, partNameY);
      
      // Add optional information (centered) - very tight spacing for Avery 5160
      let textY = labelSize === 'avery5160' ? y + 16 : y + 22;
      const optionalFontSize = labelSize === 'avery5160' ? 4 : 7;
      const lineSpacing = labelSize === 'avery5160' ? 2 : 3;
      
      if (includeDescription && part.description) {
        pdf.setFontSize(optionalFontSize);
        const maxDescLength = labelSize === 'avery5160' ? 30 : 25;
        const desc = part.description.length > maxDescLength ? part.description.substring(0, maxDescLength) + '...' : part.description;
        const descWidth = pdf.getTextWidth(desc);
        pdf.text(desc, x + (labelWidth - descWidth) / 2, textY);
        textY += lineSpacing;
      }
      
      if (includeLocation) {
        pdf.setFontSize(optionalFontSize);
        const locationText = part.location || 'No Location';
        const maxLocLength = labelSize === 'avery5160' ? 12 : 20;
        const shortLocation = locationText && locationText.length > maxLocLength ? locationText.substring(0, maxLocLength) + '...' : locationText;
        const locText = `Loc: ${shortLocation || 'No Location'}`;
        const locWidth = pdf.getTextWidth(locText);
        pdf.text(locText, x + (labelWidth - locWidth) / 2, textY);
        textY += lineSpacing;
      }
      
      if (includeQuantity) {
        pdf.setFontSize(optionalFontSize);
        const qtyText = `Qty: ${part.quantity}`;
        const qtyWidth = pdf.getTextWidth(qtyText);
        pdf.text(qtyText, x + (labelWidth - qtyWidth) / 2, textY);
      }
      
      labelIndex++;
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`barcode_labels_${timestamp}.pdf`);
  };

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return 'Unknown';
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Barcode Label Printer
          </DialogTitle>
          <DialogDescription>
            Search and select parts to generate printable barcode labels
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Left Panel - Search and Filters */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Parts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Part ID, name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Filter by Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Label Settings</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Label Size</Label>
                  <Select value={labelSize} onValueChange={(value: 'avery5160' | 'small' | 'medium' | 'large') => setLabelSize(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avery5160">Avery 5160 (30 labels/page)</SelectItem>
                      <SelectItem value="small">Small (80x40mm)</SelectItem>
                      <SelectItem value="medium">Medium (100x50mm)</SelectItem>
                      <SelectItem value="large">Large (120x60mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-description" 
                      checked={includeDescription}
                      onCheckedChange={(checked) => setIncludeDescription(checked === true)}
                    />
                    <Label htmlFor="include-description" className="text-sm">Include Description</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-location" 
                      checked={includeLocation}
                      onCheckedChange={(checked) => setIncludeLocation(checked === true)}
                    />
                    <Label htmlFor="include-location" className="text-sm">Include Location</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-quantity" 
                      checked={includeQuantity}
                      onCheckedChange={(checked) => setIncludeQuantity(checked === true)}
                    />
                    <Label htmlFor="include-quantity" className="text-sm">Include Quantity</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSelectAll} variant="outline" size="sm" className="flex-1">
                Select All
              </Button>
              <Button onClick={handleClearAll} variant="outline" size="sm" className="flex-1">
                Clear All
              </Button>
            </div>
            
            <Button 
              onClick={generatePDF} 
              disabled={selectedParts.size === 0}
              className="w-full"
            >
              <Printer className="h-4 w-4 mr-2" />
              Generate Labels ({selectedParts.size})
            </Button>
          </div>
          
          {/* Middle Panel - Parts List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <span className="font-medium">Parts ({filteredParts.length})</span>
                <Badge variant="secondary">{selectedParts.size} selected</Badge>
              </div>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {partsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading parts...</div>
              ) : filteredParts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No parts found</div>
              ) : (
                <div className="space-y-1">
                  {filteredParts.map(part => (
                    <div 
                      key={part.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedParts.has(part.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => togglePartSelection(part.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedParts.has(part.id)}
                              onChange={() => {}}
                            />
                            <div>
                              <p className="font-medium text-sm truncate">{part.name}</p>
                              <p className="text-xs text-gray-500">{part.partId}</p>
                              {part.location && (
                                <p className="text-xs text-gray-400">📍 {part.location}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Qty: {part.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <span className="font-medium">Label Preview</span>
            </div>
            
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              {selectedParts.size === 0 ? (
                <div className="text-center text-gray-500">
                  Select parts to see label preview
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(selectedParts).slice(0, 3).map(partId => {
                    const part = parts.find(p => p.id === partId);
                    if (!part) return null;
                    
                    return (
                      <div key={partId} className="border rounded p-3 bg-white">
                        <div className="text-center space-y-2">
                          <BarcodeGenerator 
                            value={part.partId}
                            width={2}
                            height={40}
                            fontSize={8}
                            margin={10}
                            marginLeft={20}
                            marginRight={20}
                            marginTop={5}
                            marginBottom={5}
                          />
                          <div className="text-xs">
                            <p className="font-medium">{part.name}</p>
                            {includeDescription && part.description && (
                              <p className="text-gray-500 truncate">{part.description}</p>
                            )}
                            {includeLocation && part.location && (
                              <p className="text-gray-500">📍 {part.location}</p>
                            )}
                            {includeQuantity && (
                              <p className="text-gray-500">Qty: {part.quantity}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {selectedParts.size > 3 && (
                    <div className="text-center text-sm text-gray-500">
                      ... and {selectedParts.size - 3} more parts
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BarcodeLabelPrinter;