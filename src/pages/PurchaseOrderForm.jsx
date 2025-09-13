import { useState, useEffect, useRef } from 'react';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Settings, Trash2, RefreshCw, MoreHorizontal, Edit } from "lucide-react";
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
    purchaseTable: [],
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
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  
  // Client projects state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [filterSearchProject, setFilterSearchProject] = useState('');

  // Vendor state
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorsError, setVendorsError] = useState(null);
  const [filterSearchVendor, setFilterSearchVendor] = useState('');

  // Dropdown options state for purchase table editing
  const [dropdownOptions, setDropdownOptions] = useState({
    categories: [],
    models: [],
    brands: [],
    types: [],
    itemNames: []
  });

  // Loading states for dropdowns
  const [loadingDropdowns, setLoadingDropdowns] = useState({
    categories: false,
    models: false,
    brands: false,
    types: false,
    itemNames: false
  });

  // Search states for inline editing
  const [inlineSearchStates, setInlineSearchStates] = useState({
    category: '',
    item: '',
    model: '',
    brand: '',
    type: ''
  });

  // Keyboard navigation state for selects
  const [selectedIndices, setSelectedIndices] = useState({
    vendor: -1,
    client: -1,
    incharge: -1
  });

  // Keyboard navigation handlers
  const handleKeyDown = (selectType, e, items, onSelect) => {
    const currentIndex = selectedIndices[selectType];
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        setSelectedIndices(prev => ({ ...prev, [selectType]: nextIndex }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
        setSelectedIndices(prev => ({ ...prev, [selectType]: prevIndex }));
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < items.length) {
          const selectedItem = items[currentIndex];
          const value = (selectedItem.id || selectedItem.vendor_id || selectedItem.project_id)?.toString();
          onSelect(value);
          // Reset selected index
          setSelectedIndices(prev => ({ ...prev, [selectType]: -1 }));
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedIndices(prev => ({ ...prev, [selectType]: -1 }));
        break;
    }
  };

  // Reset selected index when search changes
  const handleSearchChange = (setter, value, selectType) => {
    setter(value);
    setSelectedIndices(prev => ({ ...prev, [selectType]: -1 }));
  };

  const filterProjects = (list) => {
    const q = filterSearchProject.trim().toLowerCase();
    if (!q) return (list || []).slice(0, 10);
    return (list || [])
      .filter((p) => String(p.name || p.project_name || p.siteName || p.id || '').toLowerCase().includes(q))
      .slice(0, 10);
  };

  const filterVendors = (list) => {
    const q = filterSearchVendor.trim().toLowerCase();
    if (!q) return (list || []).slice(0, 10);
    
    const filtered = (list || []).filter(v => {
      const searchText = String(v.vendorName || v.vendor_name || v.name || v.id || '').toLowerCase();
      const matches = searchText.includes(q);
      // Debug logging for first few items
      if (list.indexOf(v) < 3) {
        console.log('Vendor filter debug:', { 
          vendor: v, 
          searchText, 
          query: q, 
          matches,
          vendorName: v.vendorName,
          vendor_name: v.vendor_name,
          name: v.name 
        });
      }
      return matches;
    });
    
    return filtered.slice(0, 10);
  };

  // Site incharge state
  const [siteIncharges, setSiteIncharges] = useState([]);
  const [loadingIncharges, setLoadingIncharges] = useState(false);
  const [inchargesError, setInchargesError] = useState(null);
  const [filterSearchIncharge, setFilterSearchIncharge] = useState('');

  const filterIncharges = (list) => {
    const q = filterSearchIncharge.trim().toLowerCase();
    if (!q) return (list || []).slice(0, 10);
    return (list || [])
      .filter((s) => String(s.siteEngineer || s.name || s.id || '').toLowerCase().includes(q))
      .slice(0, 10);
  };



  useEffect(() => {
    const loadPurchaseOrder = async () => {
      if (isEditMode || isViewMode) {
        try {
          setLoading(true);
          setError(null);
          
          // First check if we have PO details stored in sessionStorage (from PO list)
          const storedPODetails = sessionStorage.getItem('poDetails');
          let data;
          
          if (storedPODetails) {
            try {
              data = JSON.parse(storedPODetails);
              console.log('Using stored PO details from sessionStorage:', data);
              // Clear the stored data after using it
              sessionStorage.removeItem('poDetails');
            } catch (parseError) {
              console.warn('Failed to parse stored PO details, falling back to API call:', parseError);
              data = null;
            }
          }
          
          // If no stored data, fetch from API
          if (!data) {
            console.log('No stored PO details found, fetching from API...');
          const result = await purchaseOrderService.getPurchaseOrderById(id);
          if (result.success) {
              data = result.data;
              console.log('Purchase Order Details from API:', data);
            } else {
              setError(result.error);
              console.error('Failed to load purchase order:', result.error);
              setLoading(false);
              return;
            }
          }
            
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
              purchaseTable: data.purchaseTable || [],
              po_notes: data.po_notes,
              
              // UI Helper fields - use names directly from PO detail API
              vendor_name: data.vendor_name || data.vendor?.name || `Vendor ${data.vendor_id}`,
              client_name: data.client_name || data.client?.name || `Client ${data.client_id}`,
              siteEngineer: data.siteEngineer || data.site_incharge?.name || `Site Incharge ${data.site_incharge_id}`,
            });

            // Normalize and load items into selectedItems for view/edit table rendering
            try {
              const apiItems = Array.isArray(data.purchaseTable) ? data.purchaseTable : [];

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
        } catch (error) {
          setError('An unexpected error occurred while loading the purchase order');
          console.error('Error loading purchase order:', error);
        } finally {
          setLoading(false);
        }
      } else if (isCreateMode) {
        // Leave PO number blank initially - will be generated when vendor is selected
        // Set default current date for new PO
        const currentDate = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ 
          ...prev, 
          eno: '',
          date: currentDate
        }));
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
          console.log('First vendor structure:', result.data?.[0]);
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

  // Generate PO number based on vendor count
  const generatePONumber = async (vendorId, vendorName) => {
    if (!vendorId) {
      return '';
    }

    try {
      // Get the count of existing POs for this vendor
      const countResponse = await fetch(`https://backendaab.in/aabuildersDash/api/purchase_orders/countByVendor?vendorId=${vendorId}`);
      if (!countResponse.ok) throw new Error("Failed to fetch PO count");
      
      const vendorCount = await countResponse.json();
      const nextPoNumber = vendorCount + 1; // this will be the next PO number
      
      console.log(`Generated PO number for vendor ${vendorId}: ${nextPoNumber} (count: ${vendorCount})`);
      return nextPoNumber.toString();
      
    } catch (err) {
      console.error("Failed to fetch PO count", err);
      return '1'; // fallback to 1 if API fails
    }
  };

  // Side panel handlers


  const handleAddItem = (item) => {
    console.log('Adding item from sidebar:', item);
    
    // The SidePanel now sends both IDs and display names properly
    const newItem = {
      ...item,
      quantity: item.quantity || 1,
      unitPrice: 0,
      total: 0,
    };
    
    // Validate that we have required IDs
    if (!newItem.item_id) {
      console.error('Item missing required item_id:', newItem);
      alert('Error: Item is missing required ID. Please try selecting the item again.');
      return;
    }
    
    console.log('Item added successfully with IDs:', {
      item_id: newItem.item_id,
      category_id: newItem.category_id,
      model_id: newItem.model_id,
      brand_id: newItem.brand_id,
      type_id: newItem.type_id
    });
    
    setSelectedItems(prev => [...prev, newItem]);
    setFormData(prev => ({
      ...prev,
      purchaseTable: [...prev.purchaseTable, newItem]
    }));
  };



  const handleRemoveSelectedItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      purchaseTable: prev.purchaseTable.filter((_, i) => i !== index)
    }));
  };

  // Inline editing functions
  const handleStartEdit = (index) => {
    setEditingItemIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingItemIndex(null);
  };

  const handleSaveEdit = (index) => {
    setEditingItemIndex(null);
    // The item is already updated in selectedItems through handleItemQuantityChange and handleItemUnitPriceChange
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
      purchaseTable: updatedItems
    }));
  };



  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.vendor_id || !formData.client_id || !formData.site_incharge_id || !formData.date || !formData.eno) {
        alert('Please fill in all required fields: Vendor, Client, Site Incharge, Date, and PO Number');
        setLoading(false);
        return;
      }

      if (selectedItems.length === 0) {
        alert('Please add at least one item to the purchase order');
        setLoading(false);
        return;
      }
      
      // Format purchase table for API
      const purchaseTable = selectedItems.map(item => ({
        item_id: parseInt(item.id || item.itemId),
        category_id: parseInt(item.category_id || item.categoryId),
        model_id: parseInt(item.model_id || item.modelId),
        brand_id: parseInt(item.brand_id || item.brandId),
        type_id: parseInt(item.type_id || item.typeId),
        quantity: parseInt(item.quantity) || 1,
        amount: parseFloat(item.total || item.unitPrice) || 0
      }));

      // Format data according to the correct API structure
      const apiPayload = {
        vendor_id: parseInt(formData.vendor_id),
        client_id: parseInt(formData.client_id),
        site_incharge_id: parseInt(formData.site_incharge_id),
        date: formData.date,
        site_incharge_mobile_number: formData.site_incharge_mobile_number,
        eno: formData.eno,
        purchaseTable: purchaseTable
      };

      console.log('Sending API payload:', apiPayload);

      let response;
      if (isEditMode) {
        // Use PUT method for edit with correct endpoint
        response = await coreApiClient.put(`/purchase_orders/edit/${id}`, apiPayload);
      } else {
        // Use POST method for create
        response = await coreApiClient.post('/purchase_orders/save', apiPayload);
      }

      // Consider HTTP 200/201 as success
      if (response?.status >= 200 && response?.status < 300) {
        const result = response.data;
        const action = isEditMode ? 'updated' : 'created';
        console.log(`Purchase order ${action} successfully:`, result);

        // Show success message
        alert(`Purchase order ${action} successfully!`);

        // Redirect to list immediately after successful create/edit
        navigate('/procurement/purchase-order');

        // Generate and download PDF without blocking navigation
        setTimeout(() => {
          generatePurchaseOrderPDF({
            form: formData,
            items: selectedItems,
          });
        }, 0);
      } else {
        const action = isEditMode ? 'update' : 'create';
        console.error(`Failed to ${action} purchase order:`, response);
        setError(`Failed to ${action} purchase order. Please try again.`);
        alert(`Failed to ${action} purchase order. Please check the form and try again.`);
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      const action = isEditMode ? 'updating' : 'creating';
      const errorMessage = error.response?.data?.message || `An error occurred while ${action}. Please try again.`;
      setError(errorMessage);
      alert(errorMessage);
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
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // ===== HEADER BOX =====
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 41.8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER", 12, 22);

    doc.text(`PO No : ${form?.eno || "-"}`, 12, 28);

    doc.setFontSize(16);
    doc.text("AA BUILDERS", 105, 17, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("181 Madurai Road, Srivilliputtur - 626 125", 105, 28, { align: "center" });

    doc.line(10, 30, 200, 30);

    doc.setFont("helvetica", "bold");
    doc.text(`VENDOR:`, 12, 37);
    doc.setFont("helvetica", "normal");
    doc.text(form?.vendor_name || `Vendor ${form?.vendor_id || ''}` || '-', 35, 37);

    doc.setFont("helvetica", "bold");
    doc.text(`DATE:`, 12, 43);
    doc.setFont("helvetica", "normal");
    const dateStr = form?.date ? new Date(form.date).toLocaleDateString('en-GB') : '-';
    doc.text(dateStr, 35, 43);

    doc.setFont("helvetica", "bold");
    doc.text("SITE NAME:", 107, 37);
    doc.text("Site Incharge:", 104, 43);
    doc.setFont("helvetica", "normal");
    doc.text(form?.client_name || `Client ${form?.client_id || ''}` || '-', 130, 37);
    doc.text(form?.site_incharge_name || `#${form?.site_incharge_id || ''}` || '-', 130, 43);

    if (form?.site_incharge_mobile_number) {
      doc.setFont("helvetica", "bold");
      doc.text("Phone:", 115, 49);
      doc.setFont("helvetica", "normal");
      doc.text(`+91 ${form.site_incharge_mobile_number}`, 130, 49);
    }

    // ===== TABLE =====
    const tableBody = (items || []).map((it, idx) => [
      idx + 1,
      it.item || '-',
      it.category || '-',
      it.model || '-',
      it.brand || '-',
      it.type || '-',
      it.quantity || 0,
      `₹${(it.unitPrice || 0).toFixed(2)}`
    ]);

    // Pad empty rows so table height is consistent
    while (tableBody.length < 24) {
      tableBody.push(["", "", "", "", "", "", "", ""]);
    }

    const totalQty = (items || []).reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
    const totalPrice = (items || []).reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);

    tableBody.push([
      "", "", "", "", "",
      { content: `TOTAL`, styles: { fontStyle: "bold", halign: "center" } },
      { content: `${totalQty}`, styles: { fontStyle: "bold", halign: "center" } },
      { content: `₹${totalPrice.toFixed(2)}`, styles: { fontStyle: "bold", halign: "center" } }
    ]);

    autoTable(doc, {
      startY: 52,
      margin: { left: 10, right: 10 },
      tableWidth: 190,
      head: [["SNO", "ITEM NAME", "CATEGORY", "MODEL", "BRAND", "TYPE", "QTY", "PRICE"]],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        textColor: 0,
        lineColor: [100, 100, 100],
        lineWidth: 0.2,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 13 },
        7: { cellWidth: 17 }
      },
      didDrawPage: function () {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        doc.setFontSize(5);
        doc.text(`Created By: ${form?.created_by || ''}`, 14, pageHeight - 10);

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
        doc.text(`Date: ${formattedDateTime}`, pageWidth - 60, pageHeight - 10);
      }
    });

    // ===== SAVE FILE =====
    const fileName = `# ${form?.eno || 'new'} - ${dateStr}.pdf`;
    doc.save(fileName);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
  }
};


  const handleCancel = () => {
    navigate('/procurement/purchase-order');
  };

  // Load dropdown options for purchase table editing
  const loadDropdownOptions = async () => {
    setLoadingDropdowns({
      categories: true,
      models: true,
      brands: true,
      types: true,
      itemNames: true
    });

    try {
      const [categoriesResult, modelsResult, brandsResult, typesResult, itemNamesResult] = await Promise.all([
        purchaseOrderService.getAllCategories(),
        purchaseOrderService.getAllModels(),
        purchaseOrderService.getAllBrands(),
        purchaseOrderService.getAllTypes(),
        purchaseOrderService.getAllItemNames()
      ]);

      setDropdownOptions({
        categories: categoriesResult.success ? categoriesResult.data : [],
        models: modelsResult.success ? modelsResult.data : [],
        brands: brandsResult.success ? brandsResult.data : [],
        types: typesResult.success ? typesResult.data : [],
        itemNames: itemNamesResult.success ? itemNamesResult.data : []
      });

      console.log('Dropdown options loaded for purchase table editing:', {
        categories: categoriesResult.success ? categoriesResult.data.length : 0,
        models: modelsResult.success ? modelsResult.data.length : 0,
        brands: brandsResult.success ? brandsResult.data.length : 0,
        types: typesResult.success ? typesResult.data.length : 0,
        itemNames: itemNamesResult.success ? itemNamesResult.data.length : 0
      });

      // Debug: Log sample data structure for each type
      if (categoriesResult.success && categoriesResult.data.length > 0) {
        console.log('Sample category structure:', categoriesResult.data[0]);
      }
      if (modelsResult.success && modelsResult.data.length > 0) {
        console.log('Sample model structure:', modelsResult.data[0]);
      }
      if (brandsResult.success && brandsResult.data.length > 0) {
        console.log('Sample brand structure:', brandsResult.data[0]);
      }
      if (typesResult.success && typesResult.data.length > 0) {
        console.log('Sample type structure:', typesResult.data[0]);
      }
      if (itemNamesResult.success && itemNamesResult.data.length > 0) {
        console.log('Sample item structure:', itemNamesResult.data[0]);
      }

    } catch (error) {
      console.error('Failed to load dropdown options:', error);
    } finally {
      setLoadingDropdowns({
        categories: false,
        models: false,
        brands: false,
        types: false,
        itemNames: false
      });
    }
  };

  // Load dropdown data when component mounts
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  // Filter functions for inline editing
  const getFilteredItems = (searchTerm, categoryId) => {
    let items = dropdownOptions.itemNames || [];
    
    // Filter by category if provided
    if (categoryId) {
      // Find the category name from the ID
      const category = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === categoryId?.toString()
      );
      const categoryName = category?.category || category?.category_name;
      
      console.log('Filtering items by category:', {
        categoryId,
        category,
        categoryName,
        totalItems: items.length
      });
      
      if (categoryName) {
        items = items.filter(item => {
          const itemCategory = item.category || item.category_name || item.categoryName;
          const matches = itemCategory?.toString() === categoryName?.toString();
          if (matches) {
            console.log('Item matches category:', item, 'category field:', itemCategory);
          }
          return matches;
        });
        console.log(`Filtered items for category ${categoryName}:`, items.length, 'items');
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        String(item.itemName || item.item_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items.slice(0, 10);
  };

  const getFilteredModels = (searchTerm, categoryId) => {
    let items = dropdownOptions.models || [];
    
    // Filter by category if provided
    if (categoryId) {
      // Find the category name from the ID
      const category = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === categoryId?.toString()
      );
      const categoryName = category?.category || category?.category_name;
      
      console.log('Filtering models by category:', {
        categoryId,
        category,
        categoryName,
        totalModels: items.length
      });
      
      if (categoryName) {
        items = items.filter(item => {
          const itemCategory = item.category || item.category_name || item.categoryName;
          const matches = itemCategory?.toString() === categoryName?.toString();
          if (matches) {
            console.log('Model matches category:', item, 'category field:', itemCategory);
          }
          return matches;
        });
        console.log(`Filtered models for category ${categoryName}:`, items.length, 'items');
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        String(item.model || item.model_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items.slice(0, 10);
  };

  const getFilteredBrands = (searchTerm, categoryId) => {
    let items = dropdownOptions.brands || [];
    
    // Filter by category if provided
    if (categoryId) {
      // Find the category name from the ID
      const category = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === categoryId?.toString()
      );
      const categoryName = category?.category || category?.category_name;
      
      console.log('Filtering brands by category:', {
        categoryId,
        category,
        categoryName,
        totalBrands: items.length
      });
      
      if (categoryName) {
        items = items.filter(item => {
          const itemCategory = item.category || item.category_name || item.categoryName;
          const matches = itemCategory?.toString() === categoryName?.toString();
          if (matches) {
            console.log('Brand matches category:', item, 'category field:', itemCategory);
          }
          return matches;
        });
        console.log(`Filtered brands for category ${categoryName}:`, items.length, 'items');
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        String(item.brand || item.brand_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items.slice(0, 10);
  };

  const getFilteredTypes = (searchTerm, categoryId) => {
    let items = dropdownOptions.types || [];
    
    // Filter by category if provided
    if (categoryId) {
      // Find the category name from the ID
      const category = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === categoryId?.toString()
      );
      const categoryName = category?.category || category?.category_name;
      
      console.log('Filtering types by category:', {
        categoryId,
        category,
        categoryName,
        totalTypes: items.length
      });
      
      if (categoryName) {
        items = items.filter(item => {
          const itemCategory = item.category || item.category_name || item.categoryName;
          const matches = itemCategory?.toString() === categoryName?.toString();
          if (matches) {
            console.log('Type matches category:', item, 'category field:', itemCategory);
          }
          return matches;
        });
        console.log(`Filtered types for category ${categoryName}:`, items.length, 'items');
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        String(item.typeColor || item.type_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items.slice(0, 10);
  };

  const getFilteredCategories = (searchTerm) => {
    let items = dropdownOptions.categories || [];
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        String(item.category || item.category_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items.slice(0, 10);
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
                <div className="flex gap-2">
                <Input
                  id="eno"
                  value={formData.eno}
                  onChange={(e) => handleInputChange('eno', e.target.value)}
                    placeholder={!formData.vendor_id ? "Please select a vendor first" : "PO number will be generated"}
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                />
                </div>
                {!formData.vendor_id && isCreateMode && (
                  <p className="text-xs text-gray-500">PO number will be generated automatically when you select a vendor</p>
                )}
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
                    onValueChange={async (value) => {
                      const selectedVendor = vendors.find(v => (v.id || v.vendor_id)?.toString() === value);
                      const vendorName = selectedVendor?.vendorName || '';
                      
                      // If vendor is being changed and we already have a PO number, ask user if they want to regenerate
                      if (isCreateMode && formData.vendor_id && formData.eno && formData.vendor_id !== value) {
                        const shouldRegenerate = window.confirm(
                          'Changing vendor will generate a new PO number. Do you want to continue?'
                        );
                        if (!shouldRegenerate) {
                          return; // Don't change vendor if user cancels
                        }
                      }
                      
                      handleInputChange('vendor_id', value);
                      handleInputChange('vendor_name', vendorName);
                      
                      // Generate PO number when vendor is selected (create mode)
                      if (isCreateMode) {
                        const newPONumber = await generatePONumber(value, vendorName);
                        handleInputChange('eno', newPONumber);
                        console.log('Generated PO number for vendor:', { 
                          vendorId: value, 
                          vendorName, 
                          poNumber: newPONumber 
                        });
                      }
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
                          onChange={(e) => handleSearchChange(setFilterSearchVendor, e.target.value, 'vendor')}
                          onKeyDown={(e) => handleKeyDown('vendor', e, filterVendors(vendors), async (value) => {
                            const selectedVendor = vendors.find(v => (v.id || v.vendor_id)?.toString() === value);
                            const vendorName = selectedVendor?.vendorName || '';
                            handleInputChange('vendor_id', value);
                            handleInputChange('vendor_name', vendorName);
                            if (isCreateMode) {
                              const newPONumber = await generatePONumber(value, vendorName);
                              handleInputChange('eno', newPONumber);
                              console.log('Generated PO number for vendor:', { 
                                vendorId: value, 
                                vendorName, 
                                poNumber: newPONumber 
                              });
                            }
                          })}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {(filterVendors(vendors).slice(0, 10)).map((vendor, index) => (
                        <SelectItem 
                          key={vendor.id || vendor.vendor_id} 
                          value={(vendor.id || vendor.vendor_id)?.toString()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={`${selectedIndices.vendor === index ? 'bg-blue-100 border-blue-500' : ''}`}
                        >
                          {vendor.vendorName || `Vendor ${vendor.id || vendor.vendor_id}`}
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
                          onChange={(e) => handleSearchChange(setFilterSearchProject, e.target.value, 'client')}
                          onKeyDown={(e) => handleKeyDown('client', e, filterProjects(projects), (value) => {
                            const selectedProject = projects.find(p => (p.id || p.project_id)?.toString() === value);
                            handleInputChange('client_id', value);
                            handleInputChange('client_name', selectedProject?.name || selectedProject?.project_name || '');
                          })}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterProjects(projects).length > 0 ? (
                        filterProjects(projects).slice(0, 10).map((project, index) => (
                          <SelectItem 
                            key={project.id || project.project_id} 
                            value={(project.id || project.project_id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.client === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
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
                      if (selected?.mobileNumber) {
                        handleInputChange('site_incharge_mobile_number', selected.mobileNumber);
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
                          onChange={(e) => handleSearchChange(setFilterSearchIncharge, e.target.value, 'incharge')}
                          onKeyDown={(e) => handleKeyDown('incharge', e, filterIncharges(siteIncharges), (value) => {
                            const selected = siteIncharges.find(s => (s.id)?.toString() === value);
                            handleInputChange('site_incharge_id', value);
                            handleInputChange('siteEngineer', selected?.siteEngineer || '');
                            if (selected?.mobileNumber) {
                              handleInputChange('site_incharge_mobile_number', selected.mobileNumber);
                            }
                          })}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterIncharges(siteIncharges).slice(0, 10).map((s, index) => (
                        <SelectItem 
                          key={s.id} 
                          value={(s.id)?.toString()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className={`${selectedIndices.incharge === index ? 'bg-blue-100 border-blue-500' : ''}`}
                        >
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
                  <div className="p-3 bg-gray-50 border rounded-md">
                  <p className="font-medium">{formData.site_incharge_mobile_number || 'Not available'}</p>
                  </div>
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
                        <TableHead>Category</TableHead>
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
                          <TableCell>{item.category || 'N/A'}</TableCell>
                          <TableCell>{item.item || 'N/A'}</TableCell>
                          <TableCell>{item.model || 'N/A'}</TableCell>
                          <TableCell>{item.brand || 'N/A'}</TableCell>
                          <TableCell>{item.type || 'N/A'}</TableCell>
                          <TableCell>{`₹${(item.unitPrice || 0).toFixed(2)}`}</TableCell>
                          <TableCell>{item.quantity || 1}</TableCell>
                          <TableCell>{`₹${(item.total || 0).toFixed(2)}`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-end">
                      <p className="text-lg font-semibold">
                        Total: ₹{selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
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
                      <TableHead>Category</TableHead>
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
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            item.category || 'N/A'
                          ) : (
                            <Select
                              value={item.category_id?.toString() || ''}
                              onValueChange={(value) => {
                                const selectedCategory = dropdownOptions.categories.find(c => 
                                  (c.id || c.category_id)?.toString() === value
                                );
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return { 
                                      ...selectedItem, 
                                      category: selectedCategory?.category || selectedCategory?.category_name || '',
                                      category_id: parseInt(value)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder={item.category || "Select category"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 border-b">
                                  <Input
                                    placeholder="Search categories..."
                                    value={inlineSearchStates.category}
                                    onChange={(e) => setInlineSearchStates(prev => ({ ...prev, category: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {getFilteredCategories(inlineSearchStates.category).map((category) => (
                                  <SelectItem key={category.id || category.category_id} value={(category.id || category.category_id)?.toString()}>
                                    {category.category || category.category_name || category.name || `Category ${category.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            item.item || 'N/A'
                          ) : (
                            <Select
                              value={item.item_id?.toString() || ''}
                              onValueChange={(value) => {
                                const selectedItem = dropdownOptions.itemNames.find(i => 
                                  (i.id || i.item_id)?.toString() === value
                                );
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return { 
                                      ...selectedItem, 
                                      item: selectedItem?.itemName || selectedItem?.item_name || '',
                                      item_id: parseInt(value)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder={item.item || "Select item"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 border-b">
                                  <Input
                                    placeholder="Search items..."
                                    value={inlineSearchStates.item}
                                    onChange={(e) => setInlineSearchStates(prev => ({ ...prev, item: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {getFilteredItems(inlineSearchStates.item, item.category_id).map((availableItem) => (
                                  <SelectItem key={availableItem.id || availableItem.item_id} value={(availableItem.id || availableItem.item_id)?.toString()}>
                                    {availableItem.itemName || availableItem.item_name || availableItem.name || `Item ${availableItem.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            item.model || 'N/A'
                          ) : (
                            <Select
                              value={item.model_id?.toString() || ''}
                              onValueChange={(value) => {
                                const selectedModel = dropdownOptions.models.find(m => 
                                  (m.id || m.model_id)?.toString() === value
                                );
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return { 
                                      ...selectedItem, 
                                      model: selectedModel?.model || selectedModel?.model_name || '',
                                      model_id: parseInt(value)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder={item.model || "Select model"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 border-b">
                                  <Input
                                    placeholder="Search models..."
                                    value={inlineSearchStates.model}
                                    onChange={(e) => setInlineSearchStates(prev => ({ ...prev, model: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {getFilteredModels(inlineSearchStates.model, item.category_id).map((availableModel) => (
                                  <SelectItem key={availableModel.id || availableModel.model_id} value={(availableModel.id || availableModel.model_id)?.toString()}>
                                    {availableModel.model || availableModel.model_name || availableModel.name || `Model ${availableModel.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            item.brand || 'N/A'
                          ) : (
                            <Select
                              value={item.brand_id?.toString() || ''}
                              onValueChange={(value) => {
                                const selectedBrand = dropdownOptions.brands.find(b => 
                                  (b.id || b.brand_id)?.toString() === value
                                );
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return { 
                                      ...selectedItem, 
                                      brand: selectedBrand?.brand || selectedBrand?.brand_name || '',
                                      brand_id: parseInt(value)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder={item.brand || "Select brand"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 border-b">
                                  <Input
                                    placeholder="Search brands..."
                                    value={inlineSearchStates.brand}
                                    onChange={(e) => setInlineSearchStates(prev => ({ ...prev, brand: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {getFilteredBrands(inlineSearchStates.brand, item.category_id).map((availableBrand) => (
                                  <SelectItem key={availableBrand.id || availableBrand.brand_id} value={(availableBrand.id || availableBrand.brand_id)?.toString()}>
                                    {availableBrand.brand || availableBrand.brand_name || availableBrand.name || `Brand ${availableBrand.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            item.type || 'N/A'
                          ) : (
                            <Select
                              value={item.type_id?.toString() || ''}
                              onValueChange={(value) => {
                                const selectedType = dropdownOptions.types.find(t => 
                                  (t.id || t.type_id)?.toString() === value
                                );
                                const updatedItems = selectedItems.map((selectedItem, i) => {
                                  if (i === index) {
                                    return { 
                                      ...selectedItem, 
                                      type: selectedType?.typeColor || selectedType?.type_name || '',
                                      type_id: parseInt(value)
                                    };
                                  }
                                  return selectedItem;
                                });
                                setSelectedItems(updatedItems);
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder={item.type || "Select type"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 border-b">
                                  <Input
                                    placeholder="Search types..."
                                    value={inlineSearchStates.type}
                                    onChange={(e) => setInlineSearchStates(prev => ({ ...prev, type: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {getFilteredTypes(inlineSearchStates.type, item.category_id).map((availableType) => (
                                  <SelectItem key={availableType.id || availableType.type_id} value={(availableType.id || availableType.type_id)?.toString()}>
                                    {availableType.typeColor || availableType.type_name || availableType.name || `Type ${availableType.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
                            `₹${(item.unitPrice || 0).toFixed(2)}`
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
                                setFormData(prev => ({ ...prev, purchaseTable: updatedItems }));
                              }}
                              className="w-20"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isViewMode || editingItemIndex !== index ? (
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
                        <TableCell>₹{(item.total || 0).toFixed(2)}</TableCell>
                        {!isViewMode && (
                          <TableCell>
                            {editingItemIndex === index ? (
                              <div className="flex gap-1">
                            <Button
                              size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveEdit(index)}
                                  className="h-8 px-2"
                            >
                                  Save
                            </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleStartEdit(index)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveSelectedItem(index)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-end">
                    <p className="text-lg font-semibold">
                      Total: ₹{selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
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