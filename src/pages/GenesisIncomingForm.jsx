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

// Dummy suppliers
const suppliers = [
  'ABC Supplies Inc.',
  'XYZ Corporation',
  'Global Materials Ltd.',
  'Tech Solutions Co.',
  'Industrial Parts & Equipment',
  'Quality Components Ltd.',
  'Premium Suppliers Group',
  'Reliable Materials Corp.'
];

// Dummy statuses
const statuses = [
  'Ordered',
  'In Transit',
  'Received',
  'Partially Received',
  'Delayed',
  'Cancelled'
];

export function GenesisIncomingForm() {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEditMode = action === 'edit';
  const isViewMode = action === 'view';

  const [formData, setFormData] = useState({
    // Basic Information
    itemCode: '',
    itemName: '',
    quantity: 0,
    supplier: '',
    orderDate: '',
    expectedDelivery: '',
    priority: 'Medium',
    notes: '',
    
    // Receiving Details
    receivedQuantity: 0,
    receivedDate: '',
    receivingLocation: '',
    qualityCheck: 'Pending',
    inspectionNotes: '',
    
    // Additional Information
    requester: '',
    department: '',
    purchaseOrder: '',
    status: 'Ordered',
    specialInstructions: ''
  });

  useEffect(() => {
    if (isEditMode || isViewMode) {
      // Load existing data for editing/viewing
      setFormData({
        itemCode: `IN-${id?.padStart(6, '0')}`,
        itemName: 'Electrical Wire 100m',
        quantity: 50,
        supplier: 'ABC Supplies Inc.',
        orderDate: '2024-12-10',
        expectedDelivery: '2024-12-25',
        priority: 'High',
        notes: 'Urgent materials needed for project completion.',
        receivedQuantity: 30,
        receivedDate: '2024-12-20',
        receivingLocation: 'Warehouse A',
        qualityCheck: 'Passed',
        inspectionNotes: 'All items received in good condition.',
        requester: 'Jane Smith',
        department: 'Electrical',
        purchaseOrder: 'PO-001234',
        status: 'Partially Received',
        specialInstructions: 'Handle with care. Electrical components.'
      });
    } else {
      // Set default values for new incoming
      const nextItemCode = `IN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, itemCode: nextItemCode }));
    }
  }, [isEditMode, isViewMode, id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving incoming item:', formData);
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
              {isViewMode ? 'View Incoming Item' : isEditMode ? 'Edit Incoming Item' : 'Create Incoming Item'}
            </h1>
            <p className="text-gray-600">
              {isViewMode ? 'View incoming item details' : isEditMode ? 'Update incoming item details' : 'Create a new incoming item'}
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
                <Label htmlFor="quantity">Ordered Quantity</Label>
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
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={formData.supplier} onValueChange={(value) => handleInputChange('supplier', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
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

        {/* Receiving Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Receiving Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receivedQuantity">Received Quantity</Label>
                <Input
                  id="receivedQuantity"
                  type="number"
                  min="0"
                  value={formData.receivedQuantity}
                  onChange={(e) => handleInputChange('receivedQuantity', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedDate">Received Date</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivingLocation">Receiving Location</Label>
                <Input
                  id="receivingLocation"
                  value={formData.receivingLocation}
                  onChange={(e) => handleInputChange('receivingLocation', e.target.value)}
                  placeholder="Enter receiving location"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualityCheck">Quality Check</Label>
                <Select value={formData.qualityCheck} onValueChange={(value) => handleInputChange('qualityCheck', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionNotes">Inspection Notes</Label>
              <Input
                id="inspectionNotes"
                value={formData.inspectionNotes}
                onChange={(e) => handleInputChange('inspectionNotes', e.target.value)}
                placeholder="Enter inspection notes"
                disabled={isViewMode}
              />
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
                <Label htmlFor="purchaseOrder">Purchase Order</Label>
                <Input
                  id="purchaseOrder"
                  value={formData.purchaseOrder}
                  onChange={(e) => handleInputChange('purchaseOrder', e.target.value)}
                  placeholder="Enter purchase order number"
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
              {isEditMode ? 'Update Incoming Item' : 'Save Incoming Item'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 