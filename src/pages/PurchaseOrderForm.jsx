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
import { coreApiClient } from '@/lib/api';
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

export function PurchaseOrderForm({ modeOverride } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  // Resolve mode either from override or from route
  const isViewMode = modeOverride ? modeOverride === 'view' : window.location.pathname.includes('/view/');
  const isEditMode = modeOverride ? modeOverride === 'edit' : !!id && !isViewMode;
  const isCreateMode = modeOverride ? modeOverride === 'create' : !id && !isViewMode;

  const [formData, setFormData] = useState({
    // API Fields - Core data structure
    id: null,
    eno: '',
    vendor_id: '',
    client_id: '',
    site_incharge_id: '',
    date: '',
    mobileNumber: '',
    created_by: 'admin',
    created_date_time: '',
    delete_status: false,
    purchase_table: [],
    po_notes: '',
    
    // UI Helper fields (not sent to API)
    vendor_name: '',
    client_name: '',
    siteEngineer: '',
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
  const [filterSearchProject, setFilterSearchProject] = useState('');

  const filterProjects = (list) => {
    const q = filterSearchProject.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((p) =>
      String(p.name || p.project_name || p.siteName || p.id || '')
        .toLowerCase()
        .includes(q)
    );
  };

  // Vendor state
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorsError, setVendorsError] = useState(null);
  const [filterSearchVendor, setFilterSearchVendor] = useState('');

  const filterVendors = (list) => {
    const q = filterSearchVendor.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter(v =>
      String(v.name || v.vendor_name || v.id || '')
        .toLowerCase()
        .includes(q)
    );
  };

  // Site incharge state
  const [siteIncharges, setSiteIncharges] = useState([]);
  const [loadingIncharges, setLoadingIncharges] = useState(false);
  const [inchargesError, setInchargesError] = useState(null);
  const [filterSearchIncharge, setFilterSearchIncharge] = useState('');

  const filterIncharges = (list) => {
    const q = filterSearchIncharge.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((s) =>
      String(s.siteEngineer || s.name || s.id || '')
        .toLowerCase()
        .includes(q)
    );
  };



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
              siteEngineer: data.siteEngineer || data.site_incharge?.name || `Site Incharge ${data.site_incharge_id}`,
            });

            // Normalize and load items into selectedItems for view/edit table rendering
            try {
              const apiItems = Array.isArray(data.purchase_table) ? data.purchase_table : [];

              // Load lookups to resolve names from ids
              const lookups = await loadCatalogLookups();

              const normalized = apiItems.map((row) => {
                const quantityRaw = row.quantity ?? row.qty ?? row.count ?? 1;
                const quantity = parseInt(quantityRaw) || 1;

                // Try to infer unit price and total from common shapes
                const unitRaw = row.unitPrice ?? row.price ?? row.rate;
                let unitPrice = parseFloat(unitRaw);
                if (isNaN(unitPrice)) {
                  const amount = parseFloat(row.amount ?? row.total);
                  unitPrice = !isNaN(amount) && quantity ? amount / quantity : 0;
                }

                const totalRaw = row.total ?? row.amount ?? (unitPrice * quantity);
                const total = parseFloat(totalRaw) || 0;
                // const model_name = await purchaseOrderService.getModelNameById(row.model_id);

                const itemId = row.item_id ?? row.id ?? row.itemId;
                const modelId = row.model_id;
                const brandId = row.brand_id;
                const typeId = row.type_id;
                const categoryId = row.category_id;

                const getFrom = (map, id) => map.get((id ?? '').toString());

                return {
                  id: parseInt(itemId) || null,
                  item: getFrom(lookups.itemsMap, itemId) || row.item_name || row.itemName || `#${itemId ?? ''}`,
                  model: getFrom(lookups.modelsMap, modelId) || row.model_name || row.modelName || '-',
                  brand: getFrom(lookups.brandsMap, brandId) || row.brand_name || row.brandName || '-',
                  type: getFrom(lookups.typesMap, typeId) || row.type_name || row.typeName || '-',
                  category: getFrom(lookups.categoriesMap, categoryId) || row.category_name || row.categoryName || '-',
                  quantity,
                  unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                  total,
                };
              });
              setSelectedItems(normalized);
            } catch (mapErr) {
              console.warn('Failed to normalize purchase_table for display:', mapErr);
              setSelectedItems([]);
            }
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

  // Load vendor names for vendor dropdown
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        setVendorsError(null);
        
        const result = await purchaseOrderService.getAllVendorNames();
        if (result.success) {
          setVendors(Array.isArray(result.data) ? result.data : []);
          console.log('Vendors loaded:', result.data);
        } else {
          setVendorsError(result.error);
          console.error('Failed to load vendors:', result.error);
        }
      } catch (error) {
        const errorMessage = 'Network error while loading vendors';
        setVendorsError(errorMessage);
        console.error('Error loading vendors:', error);
      } finally {
        setLoadingVendors(false);
      }
    };

    loadVendors();
  }, []);

  // Load site incharges for dropdown
  useEffect(() => {
    const loadIncharges = async () => {
      try {
        setLoadingIncharges(true);
        setInchargesError(null);
        const result = await purchaseOrderService.getAllSiteIncharges();
        if (result.success) {
          setSiteIncharges(Array.isArray(result.data) ? result.data : []);
        } else {
          setInchargesError(result.error);
        }
      } catch (e) {
        setInchargesError('Failed to load site incharges');
      } finally {
        setLoadingIncharges(false);
      }
    };
    loadIncharges();
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
    // Ensure we carry the numeric item id from API selection
    const itemId = parseInt(item.id) || null;
    const newItem = {
      ...item,
      id: itemId,
      quantity: item.quantity || 1,
      unitPrice: 0,
      total: 0,
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
        item_id: parseInt(item.id),
        category_id: item.category_id ? parseInt(item.category_id) : 2,
        model_id: item.model_id ? parseInt(item.model_id) : 3,
        brand_id: item.brand_id ? parseInt(item.brand_id) : 4,
        type_id: item.type_id ? parseInt(item.type_id) : 5,
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
        purchase_table: purchaseTable,
        po_notes: {
          po_notes: formData.po_notes || ""
        }
      };

      console.log('Sending API payload:', apiPayload);

      // Call the new API endpoint (axios response)
      const response = await coreApiClient.post('/purchase_orders/save', apiPayload);

      // Consider HTTP 200/201 as success
      if (response?.status >= 200 && response?.status < 300) {
        const result = response.data;
        console.log('Purchase order saved successfully:', result);

        // Generate and download PDF using the current form values
        await generatePurchaseOrderPDF({
          form: formData,
          items: selectedItems,
        });

        navigate('/procurement/purchase-order');
      } else {
        console.error('Failed to save purchase order:', response);
        setError('Failed to save purchase order. Please try again.');
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setError('An error occurred while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers: build lookup maps and resolve names from ids for PO table
  const buildLookupMap = (list, idKeys = ['id'], nameKeys = ['name']) => {
    const map = new Map();
    (list || []).forEach((entry) => {
      const idKey = idKeys.find((k) => entry[k] != null);
      const nameKey = nameKeys.find((k) => entry[k] != null);
      if (idKey) {
        const id = (entry[idKey] ?? '').toString();
        const name = nameKey ? entry[nameKey] : undefined;
        if (id) map.set(id, name ?? `#${entry[idKey]}`);
      }
    });
    return map;
  };

  const loadCatalogLookups = async () => {
    const [itemsRes, modelsRes, brandsRes, typesRes, categoriesRes] = await Promise.all([
      purchaseOrderService.getAllItemNames(),
      purchaseOrderService.getAllModels(),
      purchaseOrderService.getAllBrands(),
      purchaseOrderService.getAllTypes(),
      purchaseOrderService.getAllCategories(),
    ]);

    const itemsMap = buildLookupMap(itemsRes.success ? itemsRes.data : [], ['id','item_id'], ['itemName','item_name','name']);
    const modelsMap = buildLookupMap(modelsRes.success ? modelsRes.data : [], ['id','model_id'], ['model','name']);
    const brandsMap = buildLookupMap(brandsRes.success ? brandsRes.data : [], ['id','brand_id'], ['brand','name']);
    const typesMap = buildLookupMap(typesRes.success ? typesRes.data : [], ['id','type_id'], ['typeColor','name']);
    const categoriesMap = buildLookupMap(categoriesRes.success ? categoriesRes.data : [], ['id','category_id'], ['category','name']);

    return { itemsMap, modelsMap, brandsMap, typesMap, categoriesMap };
  };

  // Generate and download a PDF for the created Purchase Order
  const generatePurchaseOrderPDF = async ({ form, items }) => {
    try {
      // Dynamic imports to avoid adding hard deps during SSR/build steps
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      let cursorY = 40;

      // Header box
      doc.setLineWidth(1);
      doc.rect(marginX, cursorY, pageWidth - marginX * 2, 60);

      // Company Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AA BUILDERS', pageWidth / 2, cursorY + 25, { align: 'center' });

      // Purchase Order Label
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PURCHASE ORDER', marginX + 8, cursorY + 50);

      // PO No
      doc.setFont('helvetica', 'normal');
      const poNo = form?.eno || '-';
      doc.text(`PO No :   ${poNo}`, marginX + 8, cursorY + 70);

      // Secondary header box (details)
      cursorY += 80;
      doc.rect(marginX, cursorY, pageWidth - marginX * 2, 90);

      const leftX = marginX + 10;
      const rightX = pageWidth / 2 + 10;
      const lineH = 16;

      // Left column details
      doc.setFont('helvetica', 'bold');
      doc.text('VENDOR:', leftX, cursorY + 20);
      doc.text('DATE:', leftX, cursorY + 20 + lineH);
      doc.setFont('helvetica', 'normal');
      doc.text(form?.vendor_name || `Vendor ${form?.vendor_id || ''}` || '-', leftX + 70, cursorY + 20);
      const dateStr = form?.date ? new Date(form.date).toLocaleDateString() : '-';
      doc.text(dateStr, leftX + 70, cursorY + 20 + lineH);

      // Right column details
      doc.setFont('helvetica', 'bold');
      doc.text('SITE NAME:', rightX, cursorY + 20);
      doc.text('Site Incharge:', rightX, cursorY + 20 + lineH);
      doc.text('Phone:', rightX, cursorY + 20 + lineH * 2);
      doc.setFont('helvetica', 'normal');
      doc.text(form?.client_name || `Client ${form?.client_id || ''}` || '-', rightX + 85, cursorY + 20);
      doc.text(form?.site_incharge_name || `#${form?.site_incharge_id || ''}` || '-', rightX + 85, cursorY + 20 + lineH);
      doc.text(form?.site_incharge_mobile_number || '-', rightX + 85, cursorY + 20 + lineH * 2);

      // Items table
      const tableStartY = cursorY + 110;
      const columns = [
        { header: 'SNO', dataKey: 'sno' },
        { header: 'ITEM NAME', dataKey: 'item' },
        { header: 'CATEGORY', dataKey: 'category' },
        { header: 'MODEL', dataKey: 'model' },
        { header: 'BRAND', dataKey: 'brand' },
        { header: 'TYPE', dataKey: 'type' },
        { header: 'QTY', dataKey: 'qty' },
        { header: 'PRICE', dataKey: 'price' },
      ];

      const rows = (items || []).map((it, idx) => ({
        sno: idx + 1,
        item: it.item || '-',
        category: it.category || '-',
        model: it.model || '-',
        brand: it.brand || '-',
        type: it.type || '-',
        qty: it.quantity || 0,
        price: (it.unitPrice || 0).toString(),
      }));

      autoTable(doc, {
        startY: tableStartY,
        head: [columns.map(c => c.header)],
        body: rows.map(r => columns.map(c => r[c.dataKey])),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20, halign: 'left' },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 36 },
          6: { cellWidth: 40, halign: 'right' },
          7: { cellWidth: 60, halign: 'right' },
        },
        didDrawPage: (data) => {},
      });

      // Total row
      const totalQty = (items || []).reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
      const totalPrice = (items || []).reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);

      const afterTableY = doc.lastAutoTable?.finalY || tableStartY;
      const totalBoxWidth = 160;
      const totalBoxX = pageWidth - marginX - totalBoxWidth;
      const totalBoxY = afterTableY + 10;

      doc.setFont('helvetica', 'bold');
      doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 40);
      doc.text('TOTAL', totalBoxX + 10, totalBoxY + 25);
      doc.text(String(totalQty), totalBoxX + 80, totalBoxY + 25, { align: 'right' });
      doc.text(String(totalPrice.toFixed(2)), totalBoxX + 150, totalBoxY + 25, { align: 'right' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Created By: ${form?.created_by || '—'}`, marginX, totalBoxY + 70);
      doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - marginX, totalBoxY + 70, { align: 'right' });

      // Save
      const fileName = `PO_${form?.eno || 'new'}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
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
              {isViewMode && 'View Purchase Order'}
              {isEditMode && 'Edit Purchase Order'}
              {isCreateMode && 'Create Purchase Order'}
            </h1>
            <p className="text-gray-600">
              {isViewMode && 'View purchase order details'}
              {isEditMode && 'Update purchase order details'}
              {isCreateMode && 'Create a new purchase order'}
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
                  <Select 
                    value={formData.vendor_id} 
                    onValueChange={(value) => {
                      const selectedVendor = vendors.find(v => (v.id || v.vendor_id)?.toString() === value);
                      handleInputChange('vendor_id', value);
                      handleInputChange('vendor_name', selectedVendor?.name || selectedVendor?.vendor_name || '');
                    }}
                    disabled={loadingVendors}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingVendors 
                          ? "Loading vendors..." 
                          : vendorsError 
                            ? "Error loading vendors" 
                            : vendors.length === 0 
                              ? "No vendors available" 
                              : "Select a vendor"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Local search */}
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search vendor..."
                          value={filterSearchVendor}
                          onChange={(e) => setFilterSearchVendor(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {(filterVendors(vendors).slice(0, 10)).map((vendor) => (
                        <SelectItem 
                          key={vendor.id || vendor.vendor_id} 
                          value={(vendor.id || vendor.vendor_id)?.toString()}
                        >
                          {vendor.name || vendor.vendor_name || `Vendor ${vendor.id || vendor.vendor_id}`}
                        </SelectItem>
                      ))}
                      {filterVendors(vendors).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                      {vendorsError && (
                        <SelectItem disabled value="error">
                          {vendorsError}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                      {/* Local search for projects */}
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search project..."
                          value={filterSearchProject}
                          onChange={(e) => setFilterSearchProject(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterProjects(projects).length > 0 ? (
                        filterProjects(projects).slice(0, 10).map((project) => (
                          <SelectItem key={project.id || project.project_id} value={(project.id || project.project_id)?.toString()}>
                            {project.name || project.project_name || project.siteName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-projects" disabled>
                          {projectsError ? "Failed to load projects" : "No results"}
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
                    <p className="font-medium">{formData.siteEngineer }</p>
                  </div>
                ) : (
                  <Select
                    value={formData.site_incharge_id?.toString() || ''}
                    onValueChange={(value) => {
                      const selected = siteIncharges.find(s => (s.id)?.toString() === value);
                      handleInputChange('site_incharge_id', value);
                      handleInputChange('siteEngineer', selected?.siteEngineer || '');
                      // Auto load mobile number if present
                      if (selected?.site_incharge_mobile_number) {
                        handleInputChange('site_incharge_mobile_number', selected.site_incharge_mobile_number);
                      }
                    }}
                    disabled={loadingIncharges}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingIncharges
                          ? 'Loading site incharges...'
                          : inchargesError
                            ? 'Error loading site incharges'
                            : siteIncharges.length === 0
                              ? 'No site incharges available'
                              : 'Select site incharge'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Local search for site engineers */}
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search site engineer..."
                          value={filterSearchIncharge}
                          onChange={(e) => setFilterSearchIncharge(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterIncharges(siteIncharges).slice(0, 10).map((s) => (
                        <SelectItem key={s.id } value={(s.id)?.toString()}>
                          {s.siteEngineer}
                        </SelectItem>
                      ))}
                      {filterIncharges(siteIncharges).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                      {inchargesError && (
                        <SelectItem disabled value="error">{inchargesError}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                  <p className="font-medium">{formData.po_notes?.po_notes || 'No notes available'}</p>
                </div>
              ) : (
                <Input
                  id="po_notes"
                  value={formData.po_notes?.po_notes || ''}
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
            {isViewMode ? (
              // View-only table (no inputs or actions)
              selectedItems.length > 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.item || 'N/A'}</TableCell>
                          <TableCell>{item.model || 'N/A'}</TableCell>
                          <TableCell>{item.brand || 'N/A'}</TableCell>
                          <TableCell>{item.type || 'N/A'}</TableCell>
                          <TableCell>{`$${(item.unitPrice || 0).toFixed(2)}`}</TableCell>
                          <TableCell>{item.quantity || 1}</TableCell>
                          <TableCell>{`$${(item.total || 0).toFixed(2)}`}</TableCell>
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
                <div className="text-center py-8 text-gray-500">No items in purchase table</div>
              )
            ) : selectedItems.length > 0 ? (
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
          {isEditMode && <Button onClick={handleSave}>Update Purchase Order</Button>}
          {isCreateMode && <Button onClick={handleSave}>Create Purchase Order</Button>}
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