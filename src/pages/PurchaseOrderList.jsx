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

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

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
        // Use current filter state
        params.filter = {
          [filterBy]: filterValue
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
          value = po.vendor_name;
          break;
        case 'client':
          value = po.client_name;
          break;
        case 'site_incharge':
          value = po.site_incharge_name;
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
    
    // Trigger API call with new filter parameters
    const filterParams = {
      [filterBy]: value
    };
    
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
          aValue = a.vendor_name || '';
          bValue = b.vendor_name || '';
          break;
        case 'client':
          aValue = a.client_name || '';
          bValue = b.client_name || '';
          break;
        case 'site_incharge':
          aValue = a.site_incharge_name || '';
          bValue = b.site_incharge_name || '';
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
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-gray-600">Manage and view all purchase orders</p>
          </div>
          <Button onClick={() => navigate('/procurement/purchase-order/create')}>
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
            <div className="flex items-center justify-between">
              <CardTitle>
                Purchase Orders ({filteredAndSortedPurchaseOrders.length})
              </CardTitle>
              
              {/* Filter and Search Controls */}
              <div className="flex items-center space-x-3">
                {/* Enhanced Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={filterBy || 'all'} onValueChange={handleFilterFieldChange}>
                    <SelectTrigger className="w-[120px]">
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
                  <div className="flex items-center space-x-2">
                    <Select value={filterValue} onValueChange={handleFilterValueChange}>
                      <SelectTrigger className="w-[140px]">
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
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Input
                      placeholder="Search... (Press Enter)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-[200px]"
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
                        <TableCell className="text-blue-800 font-medium cursor-pointer hover:underline hover:text-blue-500" onClick={() => navigate(`/procurement/purchase-order/view/${po.id}`)}>
                          <a href="#" onClick={() => navigate(`/procurement/purchase-order/view/${po.id}`)}>
                            {po.eno}
                          </a>
                        </TableCell>
                        <TableCell>{formatDate(po.date)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{po.vendor_name || `Vendor ${po.vendor_id}`}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{po.client_name || `Client ${po.client_id}`}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{po.site_incharge_name || `Site Incharge ${po.site_incharge_id}`}</p>
                        </TableCell>
                        <TableCell>{po.site_incharge_mobile_number}</TableCell>
                        <TableCell>
                          <span className="truncate max-w-xs block" title={po.po_notes}>
                            {po.po_notes || '-'}
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
                                onClick={() => navigate(`/procurement/purchase-order/view/${po.id}`)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/procurement/purchase-order/edit/${po.id}`)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 