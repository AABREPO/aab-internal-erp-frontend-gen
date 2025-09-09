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
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [sortField, setSortField] = useState(''); // Current sort field
  const [sortDirection, setSortDirection] = useState(''); // Current sort direction
  
  // New state for vendor and site incharge mappings
  const [vendors, setVendors] = useState([]);
  const [siteIncharges, setSiteIncharges] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [siteInchargeMap, setSiteInchargeMap] = useState({});
  
  // State for PO details fetching
  const [loadingPODetails, setLoadingPODetails] = useState(false);
  const [poDetailsError, setPoDetailsError] = useState(null);

  useEffect(() => {
    loadPurchaseOrders();
    loadVendorsAndSiteIncharges();
  }, []);

  // Load vendor and site incharge data to create name mappings
  const loadVendorsAndSiteIncharges = async () => {
    try {
      // Load vendors
      const vendorsResult = await purchaseOrderService.getAllVendorNames();
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
      }

      // Load site incharges
      const siteInchargesResult = await purchaseOrderService.getAllSiteIncharges();
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
      }
    } catch (error) {
      console.error('Error loading vendor/site incharge data:', error);
    }
  };

  // Helper function to get vendor name by ID
  const getVendorName = (vendorId) => {
    if (!vendorId) return '-';
    return vendorMap[vendorId] || `Vendor ${vendorId}`;
  };

  // Helper function to get site incharge name by ID
  const getSiteInchargeName = (siteInchargeId) => {
    if (!siteInchargeId) return '-';
    return siteInchargeMap[siteInchargeId] || `Site Incharge ${siteInchargeId}`;
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

  const loadPurchaseOrders = async (searchQuery = '', sortParams = null, filterParams = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      // Build parameters object
      const params = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (sortParams) {
        params.sort = {
          field: sortParams.field,
          order: sortParams.order
        };
      } else if (sortField && sortDirection) {
        // Use current sort state
        params.sort = {
          field: sortField === 'po_number' ? 'eno' : sortField,
          order: sortDirection
        };
      }
      
      if (filterParams) {
        params.filter = filterParams;
      } else if (filterBy && filterValue) {
        // Use current filter state - convert display names to IDs
        let apiFilterValue = filterValue;
        
        if (filterBy === 'vendor') {
          // Find vendor ID by name
          const vendor = vendors.find(v => 
            (v.vendorName || v.vendor_name || v.name) === filterValue
          );
          apiFilterValue = vendor ? (vendor.id || vendor.vendor_id) : filterValue;
        } else if (filterBy === 'site_incharge') {
          // Find site incharge ID by name
          const siteIncharge = siteIncharges.find(s => 
            (s.siteEngineer || s.name) === filterValue
          );
          apiFilterValue = siteIncharge ? siteIncharge.id : filterValue;
        }
        
        params.filter = {
          [filterBy]: apiFilterValue
        };
      }
      
      // Call API with structured payload
      if (searchQuery || sortParams || filterParams || (sortField && sortDirection) || (filterBy && filterValue)) {
        // Always include pagination when using structured payload
        params.pagination = {
          limit: 50,
          page: 1,
          start: 0,
          end: 50
        };
        
        console.log('Sending API request with structured payload:', params);
        result = await purchaseOrderService.getAllPurchaseOrders(params);
      } else {
        // Load all data without parameters (POST with empty body)
        console.log('Loading all data with POST request and empty body');
        result = await purchaseOrderService.getAllPurchaseOrders();
      }
      
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

  // Handle header click for sorting
  const handleHeaderClick = async (field) => {
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
    
    // Trigger API call with new sort parameters
    const sortParams = {
      field: field === 'po_number' ? 'eno' : field,
      order: newDirection
    };
    
    await loadPurchaseOrders(activeSearchTerm, sortParams);
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
          value = po.client_name;
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
          // Assuming we have a status field or derive it from other fields
          value = po.delete_status ? 'Deleted' : 'Active';
          break;
        default:
          return [];
      }
      if (value) uniqueValues.add(value);
    });
    
    return Array.from(uniqueValues).sort();
  };

  // Filter options based on search term
  const getFilteredOptions = (field) => {
    const options = getFilterOptions(field);
    if (!filterSearchTerm) return options;
    
    return options.filter(option => 
      option.toLowerCase().includes(filterSearchTerm.toLowerCase())
    );
  };

  // Handle filter field change
  const handleFilterFieldChange = async (field) => {
    if (field === 'all') {
      setFilterBy('');
      setFilterValue('');
      setFilterSearchTerm('');
      // Reload without filter
      await loadPurchaseOrders(activeSearchTerm);
    } else {
      setFilterBy(field);
      setFilterValue('');
      setFilterSearchTerm('');
    }
  };

  // Handle filter value change
  const handleFilterValueChange = async (value) => {
    setFilterValue(value);
    
    // Convert display name to ID for API filtering
    let filterValue = value;
    
    if (filterBy === 'vendor') {
      // Find vendor ID by name
      const vendor = vendors.find(v => 
        (v.vendorName || v.vendor_name || v.name) === value
      );
      filterValue = vendor ? (vendor.id || vendor.vendor_id) : value;
    } else if (filterBy === 'site_incharge') {
      // Find site incharge ID by name
      const siteIncharge = siteIncharges.find(s => 
        (s.siteEngineer || s.name) === value
      );
      filterValue = siteIncharge ? siteIncharge.id : value;
    }
    
    // Trigger API call with new filter parameters
    const filterParams = {
      [filterBy]: filterValue
    };
    
    console.log('Applying filter:', filterParams, 'Original value:', value);
    await loadPurchaseOrders(activeSearchTerm, null, filterParams);
  };

  // Handle search execution
  const handleSearch = async () => {
    const trimmedSearch = searchTerm.trim();
    setActiveSearchTerm(trimmedSearch);
    setIsSearching(true);
    
    try {
      await loadPurchaseOrders(trimmedSearch);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input key press
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = async () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearching(true);
    
    try {
      await loadPurchaseOrders();
    } finally {
      setIsSearching(false);
    }
  };

  // Sort function
  const sortPurchaseOrders = (orders, field, direction) => {
    if (!field) return orders;
    
    const isAsc = direction === 'asc';
    
    return [...orders].sort((a, b) => {
      let aValue, bValue;
      
      switch (field) {
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
          aValue = a.client_name || '';
          bValue = b.client_name || '';
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

  // All filtering, sorting, and searching is now handled by API
  // Just return the data as received from the API, ensuring it's always an array
  const filteredAndSortedPurchaseOrders = Array.isArray(purchaseOrders) ? purchaseOrders : [];

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
            <CardTitle>Purchase Orders</CardTitle>
            {poDetailsError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {poDetailsError}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              
              {/* Filter and Search Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Enhanced Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                  <Select value={filterBy || 'all'} onValueChange={handleFilterFieldChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="site_incharge">Site Incharge</SelectItem>
                      <SelectItem value="date">Date (Year)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Value Submenu */}
                {filterBy && (
                  <div className="flex items-center gap-2">
                    <Select value={filterValue} onValueChange={handleFilterValueChange}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder={`Select ${filterBy}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Search within filter options */}
                        <div className="p-2 border-b">
                          <Input
                            placeholder={`Search ${filterBy}...`}
                            value={filterSearchTerm}
                            onChange={(e) => setFilterSearchTerm(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        {getFilteredOptions(filterBy).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                        {getFilteredOptions(filterBy).length === 0 && (
                          <div className="p-2 text-sm text-gray-500">
                            No options found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Input
                      placeholder="Search... (Press Enter)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full sm:w-[220px]"
                      disabled={isSearching}
                    />
                    {isSearching && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      </div>
                    )}
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
            {filteredAndSortedPurchaseOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {activeSearchTerm ? `No purchase orders found for "${activeSearchTerm}".` : 'No purchase orders found.'}
                </p>
                {activeSearchTerm && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSearch}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-lg">
                {/* Mobile cards */}
                {isMobile && (
                  <div className="space-y-3 p-2">
                    {filteredAndSortedPurchaseOrders.map((po) => (
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
                            <div className="font-medium">{po.client_name || `Client ${po.client_id}`}</div>
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
                    {filteredAndSortedPurchaseOrders.map((po) => (
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
                          <p className="font-medium">{po.client_name || `Client ${po.client_id}`}</p>
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