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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings, Trash2 } from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';
import { purchaseOrderService } from '@/lib/purchaseOrderService';
import { SidePanel } from '@/components/SidePanel';

// Generate dummy suppliers
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

// Generate dummy items
const availableItems = [
  { id: 1, code: 'ITEM-001', name: 'Steel Beams 10ft', unitPrice: 150.00, category: 'Construction' },
  { id: 2, code: 'ITEM-002', name: 'Concrete Mix 50kg', unitPrice: 25.00, category: 'Construction' },
  { id: 3, code: 'ITEM-003', name: 'Electrical Wire 100m', unitPrice: 45.00, category: 'Electrical' },
  { id: 4, code: 'ITEM-004', name: 'PVC Pipes 6ft', unitPrice: 12.50, category: 'Plumbing' },
  { id: 5, code: 'ITEM-005', name: 'Safety Helmets', unitPrice: 35.00, category: 'Safety' },
  { id: 6, code: 'ITEM-006', name: 'Work Gloves Pack', unitPrice: 18.00, category: 'Safety' },
  { id: 7, code: 'ITEM-007', name: 'LED Light Bulbs', unitPrice: 8.50, category: 'Electrical' },
  { id: 8, code: 'ITEM-008', name: 'Paint Cans 5L', unitPrice: 28.00, category: 'Finishing' }
];

export function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes('/view/');
  const isCreateMode = !id && !isViewMode;

  const [formData, setFormData] = useState({
    // API Fields - Core data structure
    id: null,
    eno: '',
    vendor_id: '',
    client_id: '',
    site_incharge_id: '',
    date: '',
    site_incharge_mobile_number: '',
    created_by: 'admin',
    created_date_time: '',
    delete_status: false,
    purchase_table: [],
    po_notes: '',
    
    // UI Helper fields (not sent to API)
    vendor_name: '',
    client_name: '',
    site_incharge_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Side panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Client projects state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState(null);



  useEffect(() => {
    const loadPurchaseOrder = async () => {
      if (isEditMode || isViewMode) {
        try {
          setLoading(true);
          setError(null);
          
          const result = await purchaseOrderService.getPurchaseOrderById(id);
          if (result.success) {
            const data = result.data;
            console.log('Purchase Order Details from API:', data); // Debug log
            
            setFormData({
              id: data.id,
              eno: data.eno,
              vendor_id: data.vendor_id,
              client_id: data.client_id,
              site_incharge_id: data.site_incharge_id,
              date: data.date,
              site_incharge_mobile_number: data.site_incharge_mobile_number,
              created_by: data.created_by,
              created_date_time: data.created_date_time,
              delete_status: data.delete_status,
              purchase_table: data.purchase_table || [],
              po_notes: data.po_notes,
              
              // UI Helper fields - use names directly from PO detail API
              vendor_name: data.vendor_name || data.vendor?.name || `Vendor ${data.vendor_id}`,
              client_name: data.client_name || data.client?.name || `Client ${data.client_id}`,
              site_incharge_name: data.site_incharge_name || data.site_incharge?.name || `Site Incharge ${data.site_incharge_id}`,
            });
          } else {
            setError(result.error);
            console.error('Failed to load purchase order:', result.error);
          }
        } catch (error) {
          setError('An unexpected error occurred while loading the purchase order');
          console.error('Error loading purchase order:', error);
        } finally {
          setLoading(false);
        }
      } else if (isCreateMode) {
        // Set default PO number for new orders
        const nextPoNumber = `PO-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        setFormData(prev => ({ ...prev, eno: nextPoNumber }));
      }
    };

    loadPurchaseOrder();
  }, [isEditMode, isViewMode, isCreateMode, id]);

  // Load project names for client dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setProjectsError(null);
        
        // Call project names API
        const response = await fetch('http://localhost:8081/api/project_Names/getAll');
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data) ? data : []);
          console.log('Projects loaded:', data);
        } else {
          const errorMessage = `Failed to load projects: ${response.status} ${response.statusText}`;
          setProjectsError(errorMessage);
          console.error(errorMessage);
        }
      } catch (error) {
        const errorMessage = 'Network error while loading projects';
        setProjectsError(errorMessage);
        console.error('Error loading projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // Add keyboard event listener for backspace key
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if backspace is pressed and no input field is focused
      if (event.key === 'Backspace' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        event.preventDefault();
        handleCancel();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Side panel handlers


  const handleAddItem = (item) => {
    // Directly add item to purchase table with values from side panel
    const newItem = {
      ...item,
      quantity: item.quantity || 1, // Use quantity from side panel
      unitPrice: 0, // Default price, can be edited in table
      total: 0
    };
    setSelectedItems(prev => [...prev, newItem]);
    setFormData(prev => ({
      ...prev,
      purchase_table: [...prev.purchase_table, newItem]
    }));
  };



  const handleRemoveSelectedItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      purchase_table: prev.purchase_table.filter((_, i) => i !== index)
    }));
  };

  const handleItemQuantityChange = (index, quantity) => {
    const updatedItems = selectedItems.map((item, i) => {
      if (i === index) {
        const newQuantity = parseInt(quantity) || 1;
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * (item.unitPrice || 0)
        };
      }
      return item;
    });
    setSelectedItems(updatedItems);
    setFormData(prev => ({
      ...prev,
      purchase_table: updatedItems
    }));
  };



  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Format purchase table for API
      const purchaseTable = selectedItems.map(item => ({
        item_id: parseInt(item.id) || 1, // Use item id or default
        category_id: 2, // Default category id - you may want to map this from item.category
        model_id: 3, // Default model id - you may want to map this from item.model
        brand_id: 4, // Default brand id - you may want to map this from item.brand
        type_id: 5, // Default type id - you may want to map this from item.orderGroup
        quantity: parseInt(item.quantity) || 1,
        amount: parseFloat(item.total) || 0
      }));

      // Format data according to the API structure
      const apiPayload = {
        vendor_id: parseInt(formData.vendor_id) || 101,
        client_id: parseInt(formData.client_id) || 202,
        site_incharge_id: parseInt(formData.site_incharge_id) || 303,
        date: formData.date || new Date().toISOString().split('T')[0],
        site_incharge_mobile_number: formData.site_incharge_mobile_number || "",
        created_by: formData.created_by || "Admin",
        created_date_time: new Date().toISOString(),
        eno: formData.eno || "1",
        delete_status: false,
        purchaseTable: purchaseTable,
        poNotes: {
          note: formData.po_notes || ""
        }
      };

      console.log('Sending API payload:', apiPayload);

      // Call the new API endpoint
      const response = await coreApiClient.post('/purchase_orders/save', apiPayload);

      if (response.ok) {
        const result = await response.json();
        console.log('Purchase order saved successfully:', result);
        navigate('/procurement/purchase-order');
      } else {
        const errorData = await response.json();
        console.error('Failed to save purchase order:', errorData);
        setError('Failed to save purchase order. Please try again.');
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setError('An error occurred while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/procurement/purchase-order');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-r p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

          </div>
          <div>
            <h1 className="text-xl font-bold">
              {isViewMode ? 'View Purchase Order' : isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-gray-600">
              {isViewMode ? 'View purchase order details' : isEditMode ? 'Update purchase order details' : 'Create a new purchase order'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eno">Purchase Order Number (ENO)</Label>
                <Input
                  id="eno"
                  value={formData.eno}
                  onChange={(e) => handleInputChange('eno', e.target.value)}
                  placeholder="Enter PO number (e.g., PO-2024-001)"
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor</Label>
                {isViewMode ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-medium">{formData.vendor_name || `Vendor ${formData.vendor_id}`}</p>
                  </div>
                ) : (
                  <Input
                    id="vendor_id"
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                    placeholder="Enter vendor name"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                {isViewMode ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-medium">{formData.client_name || `Client ${formData.client_id}`}</p>
                  </div>
                ) : (
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => {
                      const selectedProject = projects.find(p => (p.id || p.project_id)?.toString() === value);
                      handleInputChange('client_id', value);
                      handleInputChange('client_name', selectedProject?.name || selectedProject?.project_name || '');
                    }}
                    disabled={loadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProjects 
                          ? "Loading projects..." 
                          : projectsError 
                            ? "Error loading projects" 
                            : projects.length === 0 
                              ? "No projects available" 
                              : "Select a project/client"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <SelectItem key={project.id || project.project_id} value={(project.id || project.project_id)?.toString()}>
                            {project.name || project.project_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-projects" disabled>
                          {projectsError ? "Failed to load projects" : "No projects available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {projectsError && !isViewMode && (
                  <p className="text-sm text-red-600">{projectsError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_incharge_id">Site Incharge</Label>
                {isViewMode ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-medium">{formData.site_incharge_name || `Site Incharge ${formData.site_incharge_id}`}</p>
                  </div>
                ) : (
                  <Input
                    id="site_incharge_id"
                    type="number"
                    value={formData.site_incharge_id}
                    onChange={(e) => handleInputChange('site_incharge_id', e.target.value)}
                    placeholder="Enter site incharge ID"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                {isViewMode ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-medium">{formData.date ? new Date(formData.date).toLocaleDateString() : '-'}</p>
                  </div>
                ) : (
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_incharge_mobile_number">Site Incharge Mobile Number</Label>
                {isViewMode ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-medium">{formData.site_incharge_mobile_number}</p>
                  </div>
                ) : (
                  <Input
                    id="site_incharge_mobile_number"
                    value={formData.site_incharge_mobile_number}
                    onChange={(e) => handleInputChange('site_incharge_mobile_number', e.target.value)}
                    placeholder="Enter mobile number"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_notes">Purchase Order Notes</Label>
              {isViewMode ? (
                <div className="p-3 bg-gray-50 border rounded-md min-h-[40px]">
                  <p className="font-medium">{formData.po_notes || 'No notes available'}</p>
                </div>
              ) : (
                <Input
                  id="po_notes"
                  value={formData.po_notes || ''}
                  onChange={(e) => handleInputChange('po_notes', e.target.value)}
                  placeholder="Enter additional notes"
                />
              )}
            </div>
          </CardContent>
        </Card>



        {/* Purchase Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Table</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItems.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      {!isViewMode && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item || 'N/A'}</TableCell>
                        <TableCell>{item.model || 'N/A'}</TableCell>
                        <TableCell>{item.brand || 'N/A'}</TableCell>
                        <TableCell>{item.type || 'N/A'}</TableCell>
                        <TableCell>
                          {isViewMode ? (
                            `$${(item.unitPrice || 0).toFixed(2)}`
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || 0}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return {
                                      ...selectedItem,
                                      unitPrice: price,
                                      total: price * (selectedItem.quantity || 1)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchase_table: updatedItems }));
                              }}
                              className="w-20"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode ? (
                            item.quantity || 1
                          ) : (
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                              className="w-20"
                            />
                          )}
                        </TableCell>
                        <TableCell>${(item.total || 0).toFixed(2)}</TableCell>
                        {!isViewMode && (
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSelectedItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-end">
                    <p className="text-lg font-semibold">
                      Total: ${selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items in purchase table</p>
                {!isViewMode && (
                  <p className="text-sm mt-2">Use the side panel to add items to your purchase order</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="border-t bg-white p-4">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            {isViewMode ? 'Back' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave}>
              {isEditMode ? 'Update Purchase Order' : 'Create Purchase Order'}
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Side Panel - Hidden in view mode */}
      {!isViewMode && (
        <SidePanel
          isOpen={true}
          onClose={() => {}}
          onAddItem={handleAddItem}
        />
      )}
    </div>
  );
} 