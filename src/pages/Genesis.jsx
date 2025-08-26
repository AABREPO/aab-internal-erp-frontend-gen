import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Highlighter from "react-highlight-words";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Generate dummy data for each tab
const generateOutgoingData = () => {
  const data = [];
  for (let i = 1; i <= 50; i++) {
    data.push({
      id: i,
      itemCode: `OUT-${1000 + i}`,
      itemName: `Product ${i}`,
      quantity: Math.floor(Math.random() * 100) + 1,
      destination: ['Warehouse A', 'Warehouse B', 'Store C'][Math.floor(Math.random() * 3)],
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      status: ['Shipped', 'Pending', 'Delivered'][Math.floor(Math.random() * 3)]
    });
  }
  return data;
};

const generateIncomingData = () => {
  const data = [];
  for (let i = 1; i <= 50; i++) {
    data.push({
      id: i,
      itemCode: `IN-${2000 + i}`,
      itemName: `Material ${i}`,
      quantity: Math.floor(Math.random() * 200) + 10,
      supplier: ['Supplier A', 'Supplier B', 'Vendor C'][Math.floor(Math.random() * 3)],
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      status: ['Received', 'In Transit', 'Ordered'][Math.floor(Math.random() * 3)]
    });
  }
  return data;
};

const generateProjectUsageData = () => {
  const data = [];
  for (let i = 1; i <= 50; i++) {
    data.push({
      id: i,
      projectCode: `PRJ-${3000 + i}`,
      projectName: `Project ${i}`,
      itemsUsed: Math.floor(Math.random() * 50) + 5,
      totalCost: `₹${(Math.random() * 10000 + 1000).toFixed(2)}`,
      startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      status: ['Active', 'Completed', 'On Hold'][Math.floor(Math.random() * 3)]
    });
  }
  return data;
};

const generateNetStockData = () => {
  const data = [];
  for (let i = 1; i <= 50; i++) {
    data.push({
      id: i,
      itemCode: `STK-${4000 + i}`,
      itemName: `Stock Item ${i}`,
      currentStock: Math.floor(Math.random() * 500) + 10,
      minStock: Math.floor(Math.random() * 50) + 5,
      maxStock: Math.floor(Math.random() * 1000) + 100,
      location: ['Warehouse A', 'Warehouse B', 'Store C'][Math.floor(Math.random() * 3)],
      status: ['In Stock', 'Low Stock', 'Out of Stock'][Math.floor(Math.random() * 3)]
    });
  }
  return data;
};

const initialOutgoingData = generateOutgoingData();
const initialIncomingData = generateIncomingData();
const initialProjectUsageData = generateProjectUsageData();
const initialNetStockData = generateNetStockData();

const getStatusClass = (status) => {
  switch (status) {
    case 'Shipped':
    case 'Received':
    case 'Active':
    case 'In Stock':
      return 'bg-green-100 text-green-800';
    case 'Pending':
    case 'In Transit':
    case 'On Hold':
    case 'Low Stock':
      return 'bg-yellow-100 text-yellow-800';
    case 'Delivered':
    case 'Completed':
      return 'bg-blue-100 text-blue-800';
    case 'Ordered':
    case 'Out of Stock':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Tab Table Component with Actions
const TabTable = ({ 
  data, 
  columns, 
  filter, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage,
  onView,
  onEdit,
  onDelete,
  tabType 
}) => {
  // Pagination calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div>
      <div className="hidden md:block">
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column, index) => (
                  <TableCell key={column.key}>
                    {index === 0 ? (
                      // First column as hyperlink
                      <button
                        onClick={() => onView(row.id, tabType)}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        <Highlighter
                          highlightClassName="bg-green-100"
                          searchWords={[filter]}
                          autoEscape={true}
                          textToHighlight={row[column.key]?.toString() || ''}
                        />
                      </button>
                    ) : column.key === 'status' ? (
                      <span
                        className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatusClass(
                          row[column.key]
                        )}`}
                      >
                        {row[column.key]}
                      </span>
                    ) : (
                      <Highlighter
                        highlightClassName="bg-green-100"
                        searchWords={[filter]}
                        autoEscape={true}
                        textToHighlight={row[column.key]?.toString() || ''}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(row.id, tabType)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(row.id, tabType)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(row.id, tabType)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden">
        {currentData.map((row) => (
          <div key={row.id} className="border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <button
                  onClick={() => onView(row.id, tabType)}
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  {row[columns[0].key]}
                </button>
                <p className="text-sm text-gray-600">{row[columns[1].key]}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                  row.status
                )}`}
              >
                {row.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {columns.slice(2, 4).map((column) => (
                <div key={column.key}>
                  <span className="text-gray-500">{column.label}:</span> {row[column.key]}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(row.id, tabType)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(row.id, tabType)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(row.id, tabType)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        
        {/* Mobile Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                
                if (totalPages <= 5) {
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-7 w-7 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                
                if (Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-7 w-7 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                } else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
                  return <span key={`ellipsis-${pageNum}`} className="px-1 text-xs text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Genesis() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('outgoing');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Separate filters for each tab
  const [outgoingFilter, setOutgoingFilter] = useState('');
  const [incomingFilter, setIncomingFilter] = useState('');
  const [projectUsageFilter, setProjectUsageFilter] = useState('');
  const [netStockFilter, setNetStockFilter] = useState('');

  // Separate data states for each tab
  const [outgoingData, setOutgoingData] = useState([]);
  const [incomingData, setIncomingData] = useState([]);
  const [projectUsageData, setProjectUsageData] = useState([]);
  const [netStockData, setNetStockData] = useState([]);

  // Column definitions
  const outgoingColumns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'destination', label: 'Destination' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' }
  ];

  const incomingColumns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' }
  ];

  const projectUsageColumns = [
    { key: 'projectCode', label: 'Project Code' },
    { key: 'projectName', label: 'Project Name' },
    { key: 'itemsUsed', label: 'Items Used' },
    { key: 'totalCost', label: 'Total Cost' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'status', label: 'Status' }
  ];

  const netStockColumns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'currentStock', label: 'Current Stock' },
    { key: 'minStock', label: 'Min Stock' },
    { key: 'maxStock', label: 'Max Stock' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status' }
  ];

  // Filter data based on active tab
  useEffect(() => {
    const filterData = (data, filter) => {
      if (!filter) return data;
      const lowerCaseFilter = filter.toLowerCase();
      return data.filter((item) => {
        return Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(lowerCaseFilter)
        );
      });
    };

    setOutgoingData(filterData(initialOutgoingData, outgoingFilter));
    setIncomingData(filterData(initialIncomingData, incomingFilter));
    setProjectUsageData(filterData(initialProjectUsageData, projectUsageFilter));
    setNetStockData(filterData(initialNetStockData, netStockFilter));
  }, [outgoingFilter, incomingFilter, projectUsageFilter, netStockFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [outgoingFilter, incomingFilter, projectUsageFilter, netStockFilter]);

  const handleCreateNew = (tabType) => {
    navigate(`/procurement/genesis/${tabType}/create`);
  };

  const handleView = (id, tabType) => {
    navigate(`/procurement/genesis/${tabType}/view/${id}`);
  };

  const handleEdit = (id, tabType) => {
    navigate(`/procurement/genesis/${tabType}/edit/${id}`);
  };

  const handleDelete = (id, tabType) => {
    // Here you would typically call an API to delete the item
    console.log(`Deleting ${tabType} item with ID: ${id}`);
    // For now, just remove from local state
    const dataSetters = {
      outgoing: setOutgoingData,
      incoming: setIncomingData,
      'project-usage': setProjectUsageData,
      'net-stock': setNetStockData
    };
    
    const dataSetters2 = {
      outgoing: setOutgoingData,
      incoming: setIncomingData,
      'project-usage': setProjectUsageData,
      'net-stock': setNetStockData
    };

    const setter = dataSetters[tabType];
    if (setter) {
      setter(prev => prev.filter(item => item.id !== id));
    }
  };

  const getCurrentFilter = () => {
    switch (activeTab) {
      case 'outgoing': return outgoingFilter;
      case 'incoming': return incomingFilter;
      case 'project-usage': return projectUsageFilter;
      case 'net-stock': return netStockFilter;
      default: return '';
    }
  };

  const setCurrentFilter = (value) => {
    switch (activeTab) {
      case 'outgoing': setOutgoingFilter(value); break;
      case 'incoming': setIncomingFilter(value); break;
      case 'project-usage': setProjectUsageFilter(value); break;
      case 'net-stock': setNetStockFilter(value); break;
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'outgoing': return outgoingData;
      case 'incoming': return incomingData;
      case 'project-usage': return projectUsageData;
      case 'net-stock': return netStockData;
      default: return [];
    }
  };

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'outgoing': return outgoingColumns;
      case 'incoming': return incomingColumns;
      case 'project-usage': return projectUsageColumns;
      case 'net-stock': return netStockColumns;
      default: return [];
    }
  };

  return (
    <div className="border rounded-lg p-6 pr-9 overflow-hidden h-full">
      <h1 className="text-2xl font-bold">Genesis</h1>
      
      <div className="flex items-center justify-between my-4">
        <Input
          placeholder="Search all fields..."
          value={getCurrentFilter()}
          onChange={(e) => setCurrentFilter(e.target.value)}
          className="max-w-sm mr-2"
        />
        <Button onClick={() => handleCreateNew(activeTab)} className="text-black">
          <Plus className="h-4 w-4 mr-2" />
          Create {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="outgoing" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-0">
            Outgoing
          </TabsTrigger>
          <TabsTrigger value="incoming" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-0">
            Incoming
          </TabsTrigger>
          <TabsTrigger value="project-usage" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-0">
            Project Usage
          </TabsTrigger>
          <TabsTrigger value="net-stock" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-0">
            Net Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="mt-4">
          <TabTable 
            data={outgoingData} 
            columns={outgoingColumns} 
            filter={outgoingFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tabType="outgoing"
          />
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          <TabTable 
            data={incomingData} 
            columns={incomingColumns} 
            filter={incomingFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tabType="incoming"
          />
        </TabsContent>

        <TabsContent value="project-usage" className="mt-4">
          <TabTable 
            data={projectUsageData} 
            columns={projectUsageColumns} 
            filter={projectUsageFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tabType="project-usage"
          />
        </TabsContent>

        <TabsContent value="net-stock" className="mt-4">
          <TabTable 
            data={netStockData} 
            columns={netStockColumns} 
            filter={netStockFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tabType="net-stock"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
