import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/AccountCard";
import Highlighter from "react-highlight-words";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

// Generate 200 dummy accounts
const generateDummyData = () => {
  const statuses = ['Active', 'Inactive', 'Pending'];
  const names = ['John Doe', 'Jane Smith', 'Peter Jones', 'Mary Johnson', 'David Williams', 'Sarah Brown', 'Chris Davis', 'Emily Miller', 'Michael Wilson', 'Jessica Garcia'];
  const data = [];
  
  for (let i = 1; i <= 200; i++) {
    data.push({
      id: i,
      name: `Account ${i}`,
      owner: names[Math.floor(Math.random() * names.length)],
      created: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }
  return data;
};

const initialData = generateDummyData();

const getStatusClass = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-red-100 text-red-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function AddAccount() {
  const [filter, setFilter] = useState('');
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [newAccount, setNewAccount] = useState({
    name: '',
    owner: '',
    status: 'Active',
  });

  useEffect(() => {
    const filteredData = initialData.filter((item) => {
      const lowerCaseFilter = filter.toLowerCase();
      return (
        item.id.toString().includes(lowerCaseFilter) ||
        item.name.toLowerCase().includes(lowerCaseFilter) ||
        item.owner.toLowerCase().includes(lowerCaseFilter) ||
        item.created.toLowerCase().includes(lowerCaseFilter) ||
        item.status.toLowerCase().includes(lowerCaseFilter)
      );
    });
    setData(filteredData);
    setCurrentPage(1); // Reset to first page when filtering
  }, [filter]);

  // Pagination calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleSave = () => {
    const newId = Math.max(...initialData.map((item) => item.id)) + 1;
    const newAccountData = {
      ...newAccount,
      id: newId,
      created: new Date().toLocaleDateString(),
    };
    initialData.push(newAccountData);
    setData([...initialData]);
    setNewAccount({ name: '', owner: '', status: 'Active' });
  };

  return (
    <div className="border rounded-lg p-6 pr-9 overflow-hidden h-full">
      <h1 className="text-2xl font-bold">Add Account</h1>
      <div className="flex items-center justify-between my-4">
        <Input
          placeholder="Search all fields..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm mr-2"
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button className="text-black">Add Account</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Account</SheetTitle>
              <SheetDescription>
                Fill in the details to add a new account.
              </SheetDescription>
            </SheetHeader>
            <div className="w-full h-full p-5 bg-white">
              <div className="flex justify-end space-x-2 mb-6">
                <Button size="sm" variant="outline">Cancel</Button>
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-5">
                <form className="space-y-6">
                  <div className="flex flex-col space-y-[2px]">
                    <Label className="text-secondary-foreground" htmlFor="accountName">
                      Account Name
                    </Label>
                    <Input id="accountName" placeholder="Enter account name" />
                  </div>
                  <div className="flex flex-col space-y-[2px]">
                    <Label className="text-secondary-foreground" htmlFor="accountEmail">
                      Email
                    </Label>
                    <Input id="accountEmail" placeholder="Enter email" />
                  </div>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="hidden md:block">
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Highlighter
                    highlightClassName="bg-green-100"
                    searchWords={[filter]}
                    autoEscape={true}
                    textToHighlight={row.id.toString()}
                  />
                </TableCell>
                <TableCell>
                  <Highlighter
                    highlightClassName="bg-green-100"
                    searchWords={[filter]}
                    autoEscape={true}
                    textToHighlight={row.name}
                  />
                </TableCell>
                <TableCell>
                  <Highlighter
                    highlightClassName="bg-green-100"
                    searchWords={[filter]}
                    autoEscape={true}
                    textToHighlight={row.owner}
                  />
                </TableCell>
                <TableCell>
                  <Highlighter
                    highlightClassName="bg-green-100"
                    searchWords={[filter]}
                    autoEscape={true}
                    textToHighlight={row.created}
                  />
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 font-semibold leading-tight rounded-full ${getStatusClass(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
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
      
      <div className="md:hidden">
        {currentData.map((account) => (
          <AccountCard key={account.id} account={account} filter={filter} />
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
            
            {/* Mobile Page Numbers - Show fewer */}
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
                
                // Mobile: Show current and adjacent pages
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
}
