import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { purchaseOrderService } from '@/lib/purchaseOrderService';

export function PurchaseOrderList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile?.() ?? false;
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // The actual search term being used
  const [isSearching, setIsSearching] = useState(false);
  // Multi-key filter state
  const [activeFilters, setActiveFilters] = useState({}); // { field: [values] }
  const [filterSearchTerms, setFilterSearchTerms] = useState({}); // { field: searchTerm }
  const [selectedFilterKey, setSelectedFilterKey] = useState(''); // Currently selected filter key
  const [sortField, setSortField] = useState(''); // Current sort field
  const [sortDirection, setSortDirection] = useState(''); // Current sort direction
  
  // New state for vendor, site incharge, and client mappings
  const [vendors, setVendors] = useState([]);
  const [siteIncharges, setSiteIncharges] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [siteInchargeMap, setSiteInchargeMap] = useState({});
  const [clientMap, setClientMap] = useState({});
  
  // State for PO details fetching
  const [loadingPODetails, setLoadingPODetails] = useState(false);
  const [poDetailsError, setPoDetailsError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      // First load vendor, site incharge, and client data
      await loadVendorsSiteInchargesAndClients();
      // Then load purchase orders
      await loadPurchaseOrders();
    };
    
    initializeData();
  }, []);

  // Load vendor, site incharge, and client data to create name mappings
  const loadVendorsSiteInchargesAndClients = async () => {
    try {
      console.log('Loading vendor, site incharge, and client data...');
      
      // Load vendors
      const vendorsResult = await purchaseOrderService.getAllVendorNames();
      console.log('Vendors API response:', vendorsResult);
      
      if (vendorsResult.success && Array.isArray(vendorsResult.data)) {
        setVendors(vendorsResult.data);
        // Create vendor ID to name mapping
        const vendorMapping = {};
        vendorsResult.data.forEach(vendor => {
          const vendorId = vendor.id || vendor.vendor_id;
          const vendorName = vendor.vendorName || vendor.vendor_name || vendor.name;
          if (vendorId && vendorName) {
            vendorMapping[vendorId] = vendorName;
          }
        });
        setVendorMap(vendorMapping);
        console.log('Vendor mapping created:', vendorMapping);
        console.log('Vendor mapping size:', Object.keys(vendorMapping).length);
      } else {
        console.error('Failed to load vendors:', vendorsResult.error);
      }

      // Load site incharges
      const siteInchargesResult = await purchaseOrderService.getAllSiteIncharges();
      console.log('Site Incharges API response:', siteInchargesResult);
      
      if (siteInchargesResult.success && Array.isArray(siteInchargesResult.data)) {
        setSiteIncharges(siteInchargesResult.data);
        // Create site incharge ID to name mapping
        const siteInchargeMapping = {};
        siteInchargesResult.data.forEach(siteIncharge => {
          const siteInchargeId = siteIncharge.id;
          const siteInchargeName = siteIncharge.siteEngineer || siteIncharge.name;
          if (siteInchargeId && siteInchargeName) {
            siteInchargeMapping[siteInchargeId] = siteInchargeName;
          }
        });
        setSiteInchargeMap(siteInchargeMapping);
        console.log('Site Incharge mapping created:', siteInchargeMapping);
        console.log('Site Incharge mapping size:', Object.keys(siteInchargeMapping).length);
      } else {
        console.error('Failed to load site incharges:', siteInchargesResult.error);
      }

      // Load clients/projects using the same API as in PO form
      try {
        console.log('Loading client/project data...');
        const response = await fetch('http://localhost:8081/api/project_Names/getAll');
        if (response.ok) {
          const data = await response.json();
          setClients(Array.isArray(data) ? data : []);
          console.log('Clients loaded:', data);
          
          // Create client ID to name mapping
          const clientMapping = {};
          (Array.isArray(data) ? data : []).forEach(client => {
            const clientId = client.id || client.project_id;
            const clientName = client.name || client.project_name || client.siteName;
            if (clientId && clientName) {
              clientMapping[clientId] = clientName;
            }
          });
          setClientMap(clientMapping);
          console.log('Client mapping created:', clientMapping);
          console.log('Client mapping size:', Object.keys(clientMapping).length);
        } else {
          console.error('Failed to load clients:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    } catch (error) {
      console.error('Error loading vendor/site incharge/client data:', error);
    }
  };

  // Helper function to get vendor name by ID
  const getVendorName = (vendorId) => {
    if (!vendorId) return '-';
    const vendorName = vendorMap[vendorId];
    if (!vendorName) {
      console.warn(`Vendor name not found for ID: ${vendorId}. Available mappings:`, Object.keys(vendorMap));
    }
    return vendorName || `Vendor ${vendorId}`;
  };

  // Helper function to get site incharge name by ID
  const getSiteInchargeName = (siteInchargeId) => {
    if (!siteInchargeId) return '-';
    const siteInchargeName = siteInchargeMap[siteInchargeId];
    if (!siteInchargeName) {
      console.warn(`Site incharge name not found for ID: ${siteInchargeId}. Available mappings:`, Object.keys(siteInchargeMap));
    }
    return siteInchargeName || `Site Incharge ${siteInchargeId}`;
  };

  // Helper function to get client name by ID
  const getClientName = (clientId) => {
    if (!clientId) return '-';
    const clientName = clientMap[clientId];
    if (!clientName) {
      console.warn(`Client name not found for ID: ${clientId}. Available mappings:`, Object.keys(clientMap));
    }
    return clientName || `Client ${clientId}`;
  };

  // Function to fetch PO details and navigate
  const handleViewPO = async (poId) => {
    try {
      setLoadingPODetails(true);
      setPoDetailsError(null);
      
      console.log('Fetching PO details for ID:', poId);
      const result = await purchaseOrderService.getPurchaseOrderById(poId);
      
      if (result.success) {
        console.log('PO details fetched successfully:', result.data);
        // Store the PO details in localStorage or sessionStorage for the next page
        sessionStorage.setItem('poDetails', JSON.stringify(result.data));
        // Navigate to view page
        navigate(`/procurement/purchase-order/view/${poId}`);
      } else {
        console.error('Failed to fetch PO details:', result.error);
        setPoDetailsError(result.error);
        // Still navigate but without the fetched data
        navigate(`/procurement/purchase-order/view/${poId}`);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      setPoDetailsError('Failed to fetch PO details. Please try again.');
      // Still navigate but without the fetched data
      navigate(`/procurement/purchase-order/view/${poId}`);
    } finally {
      setLoadingPODetails(false);
    }
  };

  // Function to fetch PO details and navigate to edit
  const handleEditPO = async (poId) => {
    try {
      setLoadingPODetails(true);
      setPoDetailsError(null);
      
      console.log('Fetching PO details for edit, ID:', poId);
      const result = await purchaseOrderService.getPurchaseOrderById(poId);
      
      if (result.success) {
        console.log('PO details fetched for edit:', result.data);
        // Store the PO details in localStorage or sessionStorage for the next page
        sessionStorage.setItem('poDetails', JSON.stringify(result.data));
        // Navigate to edit page
        navigate(`/procurement/purchase-order/edit/${poId}`);
      } else {
        console.error('Failed to fetch PO details for edit:', result.error);
        setPoDetailsError(result.error);
        // Still navigate but without the fetched data
        navigate(`/procurement/purchase-order/edit/${poId}`);
      }
    } catch (error) {
      console.error('Error fetching PO details for edit:', error);
      setPoDetailsError('Failed to fetch PO details. Please try again.');
      // Still navigate but without the fetched data
      navigate(`/procurement/purchase-order/edit/${poId}`);
    } finally {
      setLoadingPODetails(false);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data without parameters (POST with empty body)
      console.log('Loading all data with POST request and empty body');
      const result = await purchaseOrderService.getAllPurchaseOrders();
      
      console.log('API Response:', result);
      
      if (result.success) {
        // Ensure data is always an array
        let data = result.data;
        
        // Handle different response structures
        if (Array.isArray(data)) {
          console.log('Data is array, length:', data.length);
        } else if (data && typeof data === 'object') {
          // Check if data has a nested array (common API pattern)
          if (Array.isArray(data.data)) {
            data = data.data;
            console.log('Found nested data array, length:', data.length);
          } else if (Array.isArray(data.items)) {
            data = data.items;
            console.log('Found items array, length:', data.length);
          } else if (Array.isArray(data.results)) {
            data = data.results;
            console.log('Found results array, length:', data.length);
          } else {
            console.warn('Data is object but no array found:', data);
            data = [];
          }
        } else {
          console.warn('Data is not array or object:', typeof data, data);
          data = [];
        }
        
        console.log('Setting purchase orders data:', data);
        setPurchaseOrders(data);
      } else {
        setError(result.error || 'Failed to load purchase orders');
        console.error('Failed to load purchase orders:', result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const result = await purchaseOrderService.deletePurchaseOrder(id);
        if (result.success) {
          // Reload the list
          loadPurchaseOrders();
        } else {
          console.error('Failed to delete purchase order:', result.error);
        }
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      }
    }
  };

  // Client-side filtering and searching functions
  const applyFilters = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(po => {
      // Apply active filters
      for (const [field, values] of Object.entries(activeFilters)) {
        if (!values || values.length === 0) continue;
        
        let fieldValue;
        switch (field) {
          case 'vendor':
            fieldValue = getVendorName(po.vendor_id);
            break;
          case 'client':
            fieldValue = getClientName(po.client_id);
            break;
          case 'site_incharge':
            fieldValue = getSiteInchargeName(po.site_incharge_id);
            break;
          case 'date':
            if (po.date) {
              const year = new Date(po.date).getFullYear();
              fieldValue = !isNaN(year) ? year.toString() : '';
            } else {
              fieldValue = '';
            }
            break;
          case 'status':
            fieldValue = po.delete_status ? 'Deleted' : 'Active';
            break;
          default:
            fieldValue = po[field] || '';
        }
        
        if (!values.includes(fieldValue)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const applySearch = (data, searchQuery) => {
    if (!searchQuery || !data || !Array.isArray(data)) return data;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return data;
    
    return data.filter(po => {
      // Search across multiple fields
      const searchableFields = [
        po.eno || '',
        getVendorName(po.vendor_id) || '',
        getClientName(po.client_id) || '',
        getSiteInchargeName(po.site_incharge_id) || '',
        po.site_incharge_mobile_number || '',
        po.po_notes?.po_notes || '',
        formatDate(po.date) || ''
      ];
      
      return searchableFields.some(field => 
        field.toLowerCase().includes(query)
      );
    });
  };

  const applySorting = (data) => {
    if (!sortField || !data || !Array.isArray(data)) return data;
    
    const isAsc = sortDirection === 'asc';
    
    return [...data].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'po_number':
          aValue = a.eno || '';
          bValue = b.eno || '';
          break;
        case 'date':
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          return isAsc ? aValue - bValue : bValue - aValue;
        case 'vendor':
          aValue = getVendorName(a.vendor_id) || '';
          bValue = getVendorName(b.vendor_id) || '';
          break;
        case 'client':
          aValue = getClientName(a.client_id) || '';
          bValue = getClientName(b.client_id) || '';
          break;
        case 'site_incharge':
          aValue = getSiteInchargeName(a.site_incharge_id) || '';
          bValue = getSiteInchargeName(b.site_incharge_id) || '';
          break;
        case 'mobile':
          aValue = a.site_incharge_mobile_number || '';
          bValue = b.site_incharge_mobile_number || '';
          break;
        case 'notes':
          aValue = a.po_notes || '';
          bValue = b.po_notes || '';
          break;
        default:
          return 0;
      }
      
      // String comparison
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
      
      if (aValue < bValue) return isAsc ? -1 : 1;
      if (aValue > bValue) return isAsc ? 1 : -1;
      return 0;
    });
  };

  // Handle header click for sorting
  const handleHeaderClick = (field) => {
    let newDirection = 'asc';
    
    if (sortField === field) {
      // Toggle direction if same field
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field with ascending direction
      newDirection = 'asc';
    }
    
    // Update state
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Get sort icon for header
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Get unique values for filter options
  const getFilterOptions = (field) => {
    const uniqueValues = new Set();
    
    purchaseOrders.forEach(po => {
      let value;
      switch (field) {
        case 'vendor':
          value = getVendorName(po.vendor_id);
          break;
        case 'client':
          value = getClientName(po.client_id);
          break;
        case 'site_incharge':
          value = getSiteInchargeName(po.site_incharge_id);
          break;
        case 'date':
          if (po.date) {
            const year = new Date(po.date).getFullYear();
            if (!isNaN(year)) value = year.toString();
          }
          break;
        case 'status':
          value = po.delete_status ? 'Deleted' : 'Active';
          break;
        default:
          return [];
      }
      if (value) uniqueValues.add(value);
    });
    
    return Array.from(uniqueValues).sort();
  };

  // Filter options based on search term for specific field
  const getFilteredOptions = (field) => {
    const options = getFilterOptions(field);
    const searchTerm = filterSearchTerms[field] || '';
    if (!searchTerm) return options;
    
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Multi-key filter management functions
  const addFilter = (field, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value]
    }));
  };

  const removeFilter = (field, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(v => v !== value)
    }));
  };

  const clearFilter = (field) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  const isFilterActive = (field, value) => {
    return activeFilters[field]?.includes(value) || false;
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0);
  };

  // Handle search execution
  const handleSearch = () => {
    const trimmedSearch = searchTerm.trim();
    setActiveSearchTerm(trimmedSearch);
  };

  // Handle search input key press
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  // Handle filter search term change
  const handleFilterSearchChange = (field, value) => {
    setFilterSearchTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle filter key selection
  const handleFilterKeyChange = (key) => {
    if (key === 'clear') {
      setSelectedFilterKey('');
    } else {
      setSelectedFilterKey(key);
      // Clear the search term for the new key
      if (key) {
        setFilterSearchTerms(prev => ({
          ...prev,
          [key]: ''
        }));
      }
    }
  };

  // Handle filter value selection
  const handleFilterValueChange = (value) => {
    if (selectedFilterKey) {
      if (isFilterActive(selectedFilterKey, value)) {
        removeFilter(selectedFilterKey, value);
      } else {
        addFilter(selectedFilterKey, value);
      }
    }
  };

  // Get available filter keys
  const getAvailableFilterKeys = () => {
    return [
      { value: 'vendor', label: 'Vendor' },
      { value: 'client', label: 'Client' },
      { value: 'site_incharge', label: 'Site Incharge' },
      { value: 'date', label: 'Date (Year)' },
      { value: 'status', label: 'Status' }
    ];
  };

  // Process data with client-side filtering, searching, and sorting
  const processedPurchaseOrders = (() => {
    let data = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    
    // Apply filters
    data = applyFilters(data);
    
    // Apply search
    data = applySearch(data, activeSearchTerm);
    
    // Apply sorting
    data = applySorting(data);
    
    return data;
  })();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-gray-600">Manage and view all purchase orders</p>
          </div>
          <Button onClick={() => navigate('/procurement/purchase-order/create')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPurchaseOrders}
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Purchase Orders
              {processedPurchaseOrders.length !== purchaseOrders.length && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({processedPurchaseOrders.length} of {purchaseOrders.length})
                </span>
              )}
            </CardTitle>
            {poDetailsError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {poDetailsError}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              
              {/* Multi-Key Filter and Search Controls */}
              <div className="flex flex-col gap-3 w-full">
                {/* Active Filters Display */}
                {getActiveFilterCount() > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {Object.entries(activeFilters).map(([field, values]) => 
                      values.map(value => (
                        <div key={`${field}-${value}`} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                          <span className="font-medium">{field}:</span>
                          <span>{value}</span>
                          <button
                            onClick={() => removeFilter(field, value)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Filter Controls - Two Step Process */}
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-600">
                    Select a filter type, then choose values to filter by
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {/* Step 1: Select Filter Key */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={selectedFilterKey || undefined} onValueChange={handleFilterKeyChange}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFilterKeys().map((key) => (
                          <SelectItem key={key.value} value={key.value}>
                            {key.label}
                          </SelectItem>
                        ))}
                        {selectedFilterKey && (
                          <SelectItem value="clear" className="text-red-600">
                            Clear Selection
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Select Filter Value (only shown when key is selected) */}
                  {selectedFilterKey && (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleFilterValueChange}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder={`Select ${getAvailableFilterKeys().find(k => k.value === selectedFilterKey)?.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Search within filter options */}
                          <div className="p-2 border-b">
                            <Input
                              placeholder={`Search ${getAvailableFilterKeys().find(k => k.value === selectedFilterKey)?.label.toLowerCase()}...`}
                              value={filterSearchTerms[selectedFilterKey] || ''}
                              onChange={(e) => handleFilterSearchChange(selectedFilterKey, e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          {getFilteredOptions(selectedFilterKey).map((option) => (
                            <SelectItem key={option} value={option}>
                              <div className="flex items-center gap-2">
                                {isFilterActive(selectedFilterKey, option) && <span className="text-blue-600">✓</span>}
                                {option}
                              </div>
                            </SelectItem>
                          ))}
                          {getFilteredOptions(selectedFilterKey).length === 0 && (
                            <div className="p-2 text-sm text-gray-500">
                              No options found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Clear current filter key selection */}
                  {selectedFilterKey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFilterKey('')}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Input
                      placeholder="Search across all fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full sm:w-[220px]"
                    />
                  </div>
                  {activeSearchTerm && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSearch}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {processedPurchaseOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {activeSearchTerm || getActiveFilterCount() > 0 
                    ? `No purchase orders found matching your criteria.` 
                    : 'No purchase orders found.'}
                </p>
                {(activeSearchTerm || getActiveFilterCount() > 0) && (
                  <div className="flex gap-2 justify-center mt-2">
                    {activeSearchTerm && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSearch}
                      >
                        Clear Search
                      </Button>
                    )}
                    {getActiveFilterCount() > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAllFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg">
                {/* Mobile cards */}
                {isMobile && (
                  <div className="space-y-3 p-2">
                    {processedPurchaseOrders.map((po) => (
                      <div key={po.id} className="rounded-md border p-3 bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-gray-500">PO Number</div>
                            <div className="text-base font-semibold">{po.eno}</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleViewPO(po.id)}
                                disabled={loadingPODetails}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {loadingPODetails ? 'Loading...' : 'View'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditPO(po.id)}
                                disabled={loadingPODetails}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {loadingPODetails ? 'Loading...' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(po.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <div className="text-gray-500">Date</div>
                            <div>{formatDate(po.date)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Vendor</div>
                            <div className="font-medium">{getVendorName(po.vendor_id)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Client</div>
                            <div className="font-medium">{getClientName(po.client_id)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Site Incharge</div>
                            <div className="font-medium">{getSiteInchargeName(po.site_incharge_id)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Mobile</div>
                            <div>{po.site_incharge_mobile_number}</div>
                          </div>
                        </div>
                        {po.po_notes?.po_notes && (
                          <div className="mt-2 text-sm text-gray-700 line-clamp-2">{po.po_notes?.po_notes}</div>
                        )}
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="link" 
                            onClick={() => handleViewPO(po.id)}
                            disabled={loadingPODetails}
                          >
                            {loadingPODetails ? 'Loading...' : 'Open'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Desktop table */}
                {!isMobile && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('po_number')}
                      >
                        <div className="flex items-center">
                          PO Number
                          {getSortIcon('po_number')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('date')}
                      >
                        <div className="flex items-center">
                          Date
                          {getSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('vendor')}
                      >
                        <div className="flex items-center">
                          Vendor
                          {getSortIcon('vendor')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('client')}
                      >
                        <div className="flex items-center">
                          Client
                          {getSortIcon('client')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('site_incharge')}
                      >
                        <div className="flex items-center">
                          Site Incharge
                          {getSortIcon('site_incharge')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('mobile')}
                      >
                        <div className="flex items-center">
                          Mobile Number
                          {getSortIcon('mobile')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleHeaderClick('notes')}
                      >
                        <div className="flex items-center">
                          Notes
                          {getSortIcon('notes')}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedPurchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="text-blue-800 font-medium cursor-pointer hover:underline hover:text-blue-500" onClick={() => handleViewPO(po.id)}>
                          <a href="#" onClick={() => handleViewPO(po.id)}>
                            {po.eno}
                          </a>
                        </TableCell>
                        <TableCell>{formatDate(po.date)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{getVendorName(po.vendor_id)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{getClientName(po.client_id)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{getSiteInchargeName(po.site_incharge_id)}</p>
                        </TableCell>
                        <TableCell>{po.site_incharge_mobile_number}</TableCell>
                        <TableCell>
                          <span className="truncate max-w-xs block" title={po.po_notes?.po_notes || '-'}>
                            {po.po_notes?.po_notes || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewPO(po.id)}
                                disabled={loadingPODetails}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {loadingPODetails ? 'Loading...' : 'View'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditPO(po.id)}
                                disabled={loadingPODetails}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {loadingPODetails ? 'Loading...' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(po.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 