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

// Dummy destinations
const destinations = [
  'Warehouse A',
  'Warehouse B', 
  'Store C',
  'Distribution Center',
  'Retail Outlet',
  'Customer Site',
  'External Vendor'
];

// Dummy statuses
const statuses = [
  'Pending',
  'Shipped',
  'Delivered',
  'In Transit',
  'Cancelled'
];

export function GenesisOutgoingForm() {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEditMode = action === 'edit';
  const isViewMode = action === 'view';

  const [formData, setFormData] = useState({
    // Basic Information
    itemCode: '',
    itemName: '',
    quantity: 0,
    destination: '',
    shippingDate: '',
    expectedDelivery: '',
    priority: 'Medium',
    notes: '',
    
    // Shipping Details
    shippingMethod: 'Standard',
    trackingNumber: '',
    carrier: '',
    shippingCost: 0,
    
    // Additional Information
    requester: '',
    department: '',
    projectCode: '',
    status: 'Pending',
    specialInstructions: ''
  });

  useEffect(() => {
    if (isEditMode || isViewMode) {
      // Load existing data for editing/viewing
      setFormData({
        itemCode: `OUT-${id?.padStart(6, '0')}`,
        itemName: 'Steel Beams 10ft',
        quantity: 25,
        destination: 'Warehouse A',
        shippingDate: '2024-12-15',
        expectedDelivery: '2024-12-20',
        priority: 'High',
        notes: 'Urgent delivery required for construction project.',
        shippingMethod: 'Express',
        trackingNumber: 'TRK123456789',
        carrier: 'FedEx',
        shippingCost: 150.00,
        requester: 'John Doe',
        department: 'Engineering',
        projectCode: 'PRJ-001',
        status: 'Shipped',
        specialInstructions: 'Handle with care. Fragile items.'
      });
    } else {
      // Set default values for new outgoing
      const nextItemCode = `OUT-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, itemCode: nextItemCode }));
    }
  }, [isEditMode, isViewMode, id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving outgoing item:', formData);
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
              {isViewMode ? 'View Outgoing Item' : isEditMode ? 'Edit Outgoing Item' : 'Create Outgoing Item'}
            </h1>
            <p className="text-gray-600">
              {isViewMode ? 'View outgoing item details' : isEditMode ? 'Update outgoing item details' : 'Create a new outgoing item'}
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Select value={formData.destination} onValueChange={(value) => handleInputChange('destination', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingDate">Shipping Date</Label>
                <Input
                  id="shippingDate"
                  type="date"
                  value={formData.shippingDate}
                  onChange={(e) => handleInputChange('shippingDate', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={formData.expectedDelivery}
                  onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        {/* Shipping Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Shipping Method</Label>
                <Select value={formData.shippingMethod} onValueChange={(value) => handleInputChange('shippingMethod', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                    <SelectItem value="Overnight">Overnight</SelectItem>
                    <SelectItem value="Ground">Ground</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  placeholder="Enter tracking number"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  value={formData.carrier}
                  onChange={(e) => handleInputChange('carrier', e.target.value)}
                  placeholder="Enter carrier name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingCost">Shipping Cost</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shippingCost}
                  onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                />
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
                <Label htmlFor="requester">Requester</Label>
                <Input
                  id="requester"
                  value={formData.requester}
                  onChange={(e) => handleInputChange('requester', e.target.value)}
                  placeholder="Enter requester name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Enter department"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectCode">Project Code</Label>
                <Input
                  id="projectCode"
                  value={formData.projectCode}
                  onChange={(e) => handleInputChange('projectCode', e.target.value)}
                  placeholder="Enter project code"
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
              {isEditMode ? 'Update Outgoing Item' : 'Save Outgoing Item'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 