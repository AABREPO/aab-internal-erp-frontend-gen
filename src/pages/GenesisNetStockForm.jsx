import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';

// Dummy locations
const locations = [
  'Warehouse A',
  'Warehouse B',
  'Store C',
  'Distribution Center',
  'Retail Outlet',
  'Storage Facility',
  'Main Office'
];

// Dummy statuses
const statuses = [
  'In Stock',
  'Low Stock',
  'Out of Stock',
  'Reserved',
  'Damaged',
  'Expired'
];

export function GenesisNetStockForm() {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEditMode = action === 'edit';
  const isViewMode = action === 'view';

  const [formData, setFormData] = useState({
    // Basic Information
    itemCode: '',
    itemName: '',
    category: '',
    description: '',
    unit: '',
    notes: '',
    
    // Stock Levels
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    location: '',
    
    // Additional Information
    supplier: '',
    lastUpdated: '',
    lastAudit: '',
    status: 'In Stock',
    specialInstructions: ''
  });

  useEffect(() => {
    if (isEditMode || isViewMode) {
      // Load existing data for editing/viewing
      setFormData({
        itemCode: `STK-${id?.padStart(6, '0')}`,
        itemName: 'Safety Helmets',
        category: 'Safety Equipment',
        description: 'Industrial safety helmets with adjustable straps',
        unit: 'Pieces',
        notes: 'Standard safety equipment for construction sites.',
        currentStock: 150,
        minStock: 50,
        maxStock: 300,
        reorderPoint: 75,
        location: 'Warehouse A',
        supplier: 'Safety Supplies Co.',
        lastUpdated: '2024-12-15',
        lastAudit: '2024-11-30',
        status: 'In Stock',
        specialInstructions: 'Store in dry area. Check expiration dates regularly.'
      });
    } else {
      // Set default values for new net stock
      const nextItemCode = `STK-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, itemCode: nextItemCode }));
    }
  }, [isEditMode, isViewMode, id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving net stock item:', formData);
    navigate('/procurement/genesis');
  };

  const handleCancel = () => {
    navigate('/procurement/genesis');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isViewMode ? 'View Net Stock Item' : isEditMode ? 'Edit Net Stock Item' : 'Create Net Stock Item'}
            </h1>
            <p className="text-gray-600">
              {isViewMode ? 'View net stock item details' : isEditMode ? 'Update net stock item details' : 'Create a new net stock item'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => handleInputChange('itemCode', e.target.value)}
                  placeholder="Enter item code"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  placeholder="Enter item name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Enter category"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="Enter unit (pieces, kg, etc.)"
                  disabled={isViewMode}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter item description"
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter additional notes"
                disabled={isViewMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Levels Section */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Maximum Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  min="0"
                  value={formData.maxStock}
                  onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Enter supplier name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastUpdated">Last Updated</Label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={formData.lastUpdated}
                  onChange={(e) => handleInputChange('lastUpdated', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastAudit">Last Audit</Label>
                <Input
                  id="lastAudit"
                  type="date"
                  value={formData.lastAudit}
                  onChange={(e) => handleInputChange('lastAudit', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Input
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Enter special instructions"
                disabled={isViewMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="border-t bg-white p-6">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave}>
              {isEditMode ? 'Update Net Stock Item' : 'Save Net Stock Item'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 