import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { purchaseOrderService } from '@/lib/purchaseOrderService';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';

function useCatalog(apiFn, nameKeyCandidates) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    if (!q) return list;
    return list.filter((it) =>
      String(nameKeyCandidates.map(k => it[k]).find(Boolean) || it.name || it.id)
        .toLowerCase()
        .includes(q)
    );
  }, [items, search, nameKeyCandidates]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFn();
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
        setError(res.error || 'Failed to load data');
      }
    } catch (e) {
      console.error('Load error:', e);
      setError(e.message || 'Network error - please check your connection');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { items, filtered, loading, error, search, setSearch, reload: load };
}

// Component for sites management table (outside main component to prevent focus loss)
const SitesManagementTable = ({ sites, addSite, removeSite, updateSite }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label>Sites</Label>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={addSite}
        className="h-6 px-2"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Site
      </Button>
    </div>
    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
        <div className="col-span-3">Site Name</div>
        <div className="col-span-2">Site No</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-4">Branch</div>
        <div className="col-span-1">Action</div>
      </div>
      
      {/* Rows */}
      {sites.map((site, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center">
          {/* Site Name */}
          <div className="col-span-3">
            <Input
              placeholder="Site name..."
              value={site.siteName}
              onChange={(e) => updateSite(index, 'siteName', e.target.value)}
              className="h-8"
            />
          </div>
          
          {/* Site No */}
          <div className="col-span-2">
            <Input
              placeholder="Site no..."
              value={site.siteNo}
              onChange={(e) => updateSite(index, 'siteNo', e.target.value)}
              className="h-8"
            />
          </div>
          
          {/* Status */}
          <div className="col-span-2">
            <Select 
              value={site.siteStatus ? "true" : "false"} 
              onValueChange={(value) => updateSite(index, 'siteStatus', value === "true")}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Branch */}
          <div className="col-span-4">
            <Input
              placeholder="Branch..."
              value={site.branch}
              onChange={(e) => updateSite(index, 'branch', e.target.value)}
              className="h-8"
            />
          </div>
          
          {/* Remove Button */}
          <div className="col-span-1">
            {sites.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSite(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

function CatalogTab({ title, apiFn, nameKeyCandidates, idKeyCandidates, resourcePath, customFields = [], hasAdvancedFields = false }) {
  const { filtered, loading, error, search, setSearch, reload } = useCatalog(apiFn, nameKeyCandidates);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);

  // Reset form states when title changes (tab switch)
  useEffect(() => {
    setNewName('');
    setNewCategory('');
    setCustomFieldValues({});
    setIsModalOpen(false);
    setEditModalOpen(false);
    setEditingItem(null);
    if (hasAdvancedFields) {
      setSelectedGroup('');
      setCombinedRows([{ 
        model: '', 
        brand: '', 
        type: '', 
        minQty: '', 
        defaultQty: '' 
      }]);
    }
    // Reset sites for Site Incharge
    if (title === 'Site In-charge') {
      setSites([{
        siteName: '',
        siteNo: '',
        siteStatus: true,
        branch: ''
      }]);
    }
  }, [title, hasAdvancedFields]);
  
  // Advanced fields for Items
  const [selectedGroup, setSelectedGroup] = useState('');
  const [combinedRows, setCombinedRows] = useState([{ 
    model: '', 
    brand: '', 
    type: '', 
    minQty: '', 
    defaultQty: '' 
  }]);
  const [groups, setGroups] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);

  // Sites management for Site Incharge
  const [sites, setSites] = useState([{
    siteName: '',
    siteNo: '',
    siteStatus: true,
    branch: ''
  }]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  // Reset page on new search
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  // Load categories for the dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories...');
        const res = await purchaseOrderService.getAllCategories();
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
          console.log('Categories loaded:', res.data.length);
        } else {
          console.warn('Failed to load categories:', res.error);
          setCategories([]);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Load advanced fields data for Items tab
  useEffect(() => {
    if (hasAdvancedFields) {
      const loadAdvancedData = async () => {
        try {
          console.log('Loading advanced fields data...');
          const [groupsRes, modelsRes, brandsRes, typesRes] = await Promise.all([
            purchaseOrderService.getAllGroups(),
            purchaseOrderService.getAllModels(),
            purchaseOrderService.getAllBrands(),
            purchaseOrderService.getAllTypes()
          ]);

          if (groupsRes.success && Array.isArray(groupsRes.data)) {
            setGroups(groupsRes.data);
            console.log('Groups loaded:', groupsRes.data.length);
          } else {
            console.warn('Failed to load groups:', groupsRes.error);
            setGroups([]);
          }
          
          if (modelsRes.success && Array.isArray(modelsRes.data)) {
            setModels(modelsRes.data);
            console.log('Models loaded:', modelsRes.data.length);
          } else {
            console.warn('Failed to load models:', modelsRes.error);
            setModels([]);
          }
          
          if (brandsRes.success && Array.isArray(brandsRes.data)) {
            setBrands(brandsRes.data);
            console.log('Brands loaded:', brandsRes.data.length);
          } else {
            console.warn('Failed to load brands:', brandsRes.error);
            setBrands([]);
          }
          
          if (typesRes.success && Array.isArray(typesRes.data)) {
            setTypes(typesRes.data);
            console.log('Types loaded:', typesRes.data.length);
          } else {
            console.warn('Failed to load types:', typesRes.error);
            setTypes([]);
          }
        } catch (e) {
          console.error('Failed to load advanced fields data:', e);
          setGroups([]);
          setModels([]);
          setBrands([]);
          setTypes([]);
        }
      };
      loadAdvancedData();
    }
  }, [hasAdvancedFields]);

  const resolveName = (row) => nameKeyCandidates.map(k => row[k]).find(Boolean) || row.name || '';
  const resolveId = (row) => idKeyCandidates.map(k => row[k]).find(Boolean) || row.id;

  // Helper functions for combined rows
  const addCombinedRow = () => {
    setCombinedRows([...combinedRows, { 
      model: '', 
      brand: '', 
      type: '', 
      minQty: '', 
      defaultQty: '' 
    }]);
  };

  const removeCombinedRow = (index) => {
    if (combinedRows.length > 1) {
      setCombinedRows(combinedRows.filter((_, i) => i !== index));
    }
  };

  const updateCombinedRow = (index, field, value) => {
    setCombinedRows(combinedRows.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  // Helper functions for sites management
  const addSite = () => {
    setSites([...sites, {
      siteName: '',
      siteNo: '',
      siteStatus: true,
      branch: ''
    }]);
  };

  const removeSite = (index) => {
    if (sites.length > 1) {
      setSites(sites.filter((_, i) => i !== index));
    }
  };

  const updateSite = (index, field, value) => {
    setSites(sites.map((site, i) => 
      i === index ? { ...site, [field]: value } : site
    ));
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Please enter a name');
      return;
    }
    
    setSaving(true);
    try {
      // Find the selected category to get its value/name
      const selectedCategoryObj = newCategory ? 
        categories.find(cat => String(cat.id || cat.category_id) === newCategory) : null;
      const categoryValue = selectedCategoryObj ? 
        (selectedCategoryObj.category || selectedCategoryObj.category_name || selectedCategoryObj.name) : null;

      // Handle Site In-charge specific payload structure
      let payload;
      if (title === 'Site In-charge') {
        payload = {
          siteEngineer: newName,
          mobileNumber: customFieldValues.mobileNumber || '',
          sites: sites.filter(site => site.siteName.trim()) // Only include sites with names
        };
      } else {
        // Default payload for other catalog items
        payload = { 
          [nameKeyCandidates[0]]: newName,
          ...(categoryValue && { category: categoryValue }),
          ...customFieldValues,
          ...(hasAdvancedFields && {
            group_id: selectedGroup,
            combined_items: combinedRows.filter(row => row.model || row.brand || row.type)
          })
        };
      }
      
      console.log('Creating item with payload:', payload);
      const res = await purchaseOrderService.createCatalogItem(resourcePath, payload);
      
      if (res.success) {
        // Reset form
        setNewName('');
        setNewCategory('');
        setCustomFieldValues({});
        if (hasAdvancedFields) {
          setSelectedGroup('');
          setCombinedRows([{ 
            model: '', 
            brand: '', 
            type: '', 
            minQty: '', 
            defaultQty: '' 
          }]);
        }
        if (title === 'Site In-charge') {
          setSites([{
            siteName: '',
            siteNo: '',
            siteStatus: true,
            branch: ''
          }]);
        }
        setIsModalOpen(false);
        reload();
        alert(`${title.slice(0, -1)} created successfully!`);
      } else {
        console.error('Create failed:', res.error);
        alert(`Failed to create ${title.toLowerCase().slice(0, -1)}: ${res.error}`);
      }
    } catch (error) {
      console.error('Create error:', error);
      alert(`Error creating ${title.toLowerCase().slice(0, -1)}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    const id = resolveId(row);
    const name = resolveName(row);
    
    // Set up editing state
    setEditingItem(row);
    setNewName(name);
    
    // Set custom field values if they exist
    const editCustomFieldValues = {};
    customFields.forEach(field => {
      editCustomFieldValues[field.key] = row[field.key] || '';
    });
    setCustomFieldValues(editCustomFieldValues);
    
    // Set category if applicable and exists
    // Look for category value and find matching category ID for the dropdown
    const rowCategoryValue = row.category || row.category_name;
    if (rowCategoryValue) {
      const matchingCategory = categories.find(cat => 
        (cat.category || cat.category_name || cat.name) === rowCategoryValue
      );
      setNewCategory(matchingCategory ? String(matchingCategory.id || matchingCategory.category_id) : '');
    } else if (row.category_id) {
      // Fallback to category_id if category value is not found
      setNewCategory(String(row.category_id));
    } else {
      setNewCategory('');
    }
    
    // Set advanced fields for Items
    if (hasAdvancedFields) {
      setSelectedGroup(row.group_id ? String(row.group_id) : '');
      
      // Set combined rows if they exist
      if (row.combined_items && Array.isArray(row.combined_items)) {
        setCombinedRows(row.combined_items.map(item => ({
          model: item.model_id ? String(item.model_id) : '',
          brand: item.brand_id ? String(item.brand_id) : '',
          type: item.type_id ? String(item.type_id) : '',
          minQty: item.min_qty || '',
          defaultQty: item.default_qty || ''
        })));
      }
    }
    
    // Set sites for Site Incharge
    if (title === 'Site In-charge') {
      if (row.sites && Array.isArray(row.sites) && row.sites.length > 0) {
        setSites(row.sites.map(site => ({
          siteName: site.siteName || '',
          siteNo: site.siteNo || '',
          siteStatus: site.siteStatus !== undefined ? site.siteStatus : true,
          branch: site.branch || ''
        })));
      } else {
        setSites([{
          siteName: '',
          siteNo: '',
          siteStatus: true,
          branch: ''
        }]);
      }
    }
    
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!newName.trim()) {
      alert('Please enter a name');
      return;
    }
    
    const id = resolveId(editingItem);
    setSaving(true);
    
    try {
      // Find the selected category to get its value/name
      const selectedCategoryObj = newCategory ? 
        categories.find(cat => String(cat.id || cat.category_id) === newCategory) : null;
      const categoryValue = selectedCategoryObj ? 
        (selectedCategoryObj.category || selectedCategoryObj.category_name || selectedCategoryObj.name) : null;

      // Handle Site In-charge specific payload structure
      let payload;
      if (title === 'Site In-charge') {
        payload = {
          siteEngineer: newName,
          mobileNumber: customFieldValues.mobileNumber || '',
          sites: sites.filter(site => site.siteName.trim()) // Only include sites with names
        };
      } else {
        // Default payload for other catalog items
        payload = { 
          [nameKeyCandidates[0]]: newName,
          ...(categoryValue && { category: categoryValue }),
          ...customFieldValues,
          ...(hasAdvancedFields && {
            group_id: selectedGroup,
            combined_items: combinedRows.filter(row => row.model || row.brand || row.type)
          })
        };
      }
      
      console.log('Updating item:', id, payload);
      const res = await purchaseOrderService.updateCatalogItem(resourcePath, id, payload);
      
      if (res.success) {
        // Reset form
        setNewName('');
        setNewCategory('');
        setCustomFieldValues({});
        setEditingItem(null);
        if (hasAdvancedFields) {
          setSelectedGroup('');
          setCombinedRows([{ 
            model: '', 
            brand: '', 
            type: '', 
            minQty: '', 
            defaultQty: '' 
          }]);
        }
        if (title === 'Site In-charge') {
          setSites([{
            siteName: '',
            siteNo: '',
            siteStatus: true,
            branch: ''
          }]);
        }
        setEditModalOpen(false);
        reload();
        alert(`${title.slice(0, -1)} updated successfully!`);
      } else {
        console.error('Update failed:', res.error);
        alert(`Failed to update ${title.toLowerCase().slice(0, -1)}: ${res.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`Error updating ${title.toLowerCase().slice(0, -1)}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const id = resolveId(row);
    const name = resolveName(row);
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      console.log('Deleting item:', id);
      const res = await purchaseOrderService.deleteCatalogItem(resourcePath, id);
      
      if (res.success) {
        reload();
        alert(`${title.slice(0, -1)} deleted successfully!`);
      } else {
        console.error('Delete failed:', res.error);
        alert(`Failed to delete ${title.toLowerCase().slice(0, -1)}: ${res.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting ${title.toLowerCase().slice(0, -1)}: ${error.message}`);
    }
  };

  // Component for combined rows table
  const CombinedRowsTable = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Models, Brands & Types/Colors</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCombinedRow}
          className="h-6 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
          <div className="col-span-3">Model</div>
          <div className="col-span-3">Brand</div>
          <div className="col-span-3">Type/Color</div>
          <div className="col-span-1">Min QTY</div>
          <div className="col-span-1">Default QTY</div>
          <div className="col-span-1">Action</div>
        </div>
        
        {/* Rows */}
        {combinedRows.map((row, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center">
            {/* Model Select */}
            <div className="col-span-3">
              <Select 
                value={row.model} 
                onValueChange={(value) => updateCombinedRow(index, 'model', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem 
                      key={model.id || model.model_id} 
                      value={String(model.id || model.model_id)}
                    >
                      {model.model || model.model_name || model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Brand Select */}
            <div className="col-span-3">
              <Select 
                value={row.brand} 
                onValueChange={(value) => updateCombinedRow(index, 'brand', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select brand..." />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem 
                      key={brand.id || brand.brand_id} 
                      value={String(brand.id || brand.brand_id)}
                    >
                      {brand.brand || brand.brand_name || brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Type Select */}
            <div className="col-span-3">
              <Select 
                value={row.type} 
                onValueChange={(value) => updateCombinedRow(index, 'type', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem 
                      key={type.id || type.type_id} 
                      value={String(type.id || type.type_id)}
                    >
                      {type.typeColor || type.type_name || type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Min QTY */}
            <div className="col-span-1">
              <Input
                placeholder="Min"
                value={row.minQty}
                onChange={(e) => updateCombinedRow(index, 'minQty', e.target.value)}
                className="h-8"
                type="number"
              />
            </div>
            
            {/* Default QTY */}
            <div className="col-span-1">
              <Input
                placeholder="Default"
                value={row.defaultQty}
                onChange={(e) => updateCombinedRow(index, 'defaultQty', e.target.value)}
                className="h-8"
                type="number"
              />
            </div>
            
            {/* Remove Button */}
            <div className="col-span-1">
              {combinedRows.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCombinedRow(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );



  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e)=>setSearch(e.target.value)} className="h-8 w-52" />
          <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add {title.slice(0, -1)}
              </Button>
            </DialogTrigger>
            <DialogContent className={hasAdvancedFields || title === 'Site In-charge' ? "max-w-6xl" : "max-w-lg"}>
              <DialogHeader>
                <DialogTitle>Add New {title.slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder={`Enter ${title.toLowerCase().slice(0, -1)} name...`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>                
                {/* Custom Fields */}
                {customFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={customFieldValues[field.key] || ''}
                      onChange={(e) => setCustomFieldValues(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                    />
                  </div>
                ))}
                
                {/* Sites management for Site In-charge */}
                {title === 'Site In-charge' && (
                  <SitesManagementTable 
                    sites={sites}
                    addSite={addSite}
                    removeSite={removeSite}
                    updateSite={updateSite}
                  />
                )}
                
                {/* Advanced fields for Items */}
                {hasAdvancedFields && (
                  <>
                    {/* Category - Single Select */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id || category.category_id} 
                              value={String(category.id || category.category_id)}
                            >
                              {category.category || category.category_name || category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Group Name - Single Select */}
                    <div className="space-y-2">
                      <Label htmlFor="group">Group Name</Label>
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem 
                              key={group.id || group.group_id} 
                              value={String(group.id || group.group_id)}
                            >
                              {group.group_name || group.groupName || group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Combined Models, Brands, Types Table */}
                    <CombinedRowsTable />
                  </>
                )}
                {/* Category field - exempt Categories, Site In-charge, Groups, and Items (Items has advanced fields) */}
                {!['Categories', 'Site In-charge', 'Groups', 'Items'].includes(title) && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id || category.category_id} 
                            value={String(category.id || category.category_id)}
                          >
                            {category.category || category.category_name || category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
                  {saving ? 'Adding...' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Modal */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className={hasAdvancedFields || title === 'Site In-charge' ? "max-w-6xl" : "max-w-lg"}>
              <DialogHeader>
                <DialogTitle>Edit {title.slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    placeholder={`Enter ${title.toLowerCase().slice(0, -1)} name...`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>                
                {/* Custom Fields */}
                {customFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`edit-${field.key}`}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={customFieldValues[field.key] || ''}
                      onChange={(e) => setCustomFieldValues(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                    />
                  </div>
                ))}
                
                {/* Sites management for Site In-charge */}
                {title === 'Site In-charge' && (
                  <SitesManagementTable 
                    sites={sites}
                    addSite={addSite}
                    removeSite={removeSite}
                    updateSite={updateSite}
                  />
                )}
                
                {/* Advanced fields for Items */}
                {hasAdvancedFields && (
                  <>
                    {/* Category - Single Select */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id || category.category_id} 
                              value={String(category.id || category.category_id)}
                            >
                              {category.category || category.category_name || category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Group Name - Single Select */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-group">Group Name</Label>
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem 
                              key={group.id || group.group_id} 
                              value={String(group.id || group.group_id)}
                            >
                              {group.group_name || group.groupName || group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Combined Models, Brands, Types Table */}
                    <CombinedRowsTable />
                  </>
                )}
                {/* Category field - exempt Categories, Site In-charge, Groups, and Items (Items has advanced fields) */}
                {!['Categories', 'Site In-charge', 'Groups', 'Items'].includes(title) && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id || category.category_id} 
                            value={String(category.id || category.category_id)}
                          >
                            {category.category || category.category_name || category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={saving || !newName.trim()}>
                  {saving ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Name</TableHead>
                  {title === 'Site In-charge' && (
                    <TableHead className="w-32">Mobile Number</TableHead>
                  )}
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((it) => {
                  const id = resolveId(it);
                  const name = resolveName(it) || `#${id}`;
                  return (
                    <TableRow key={id}>
                      <TableCell>{id}</TableCell>
                      <TableCell>{name}</TableCell>
                      {title === 'Site In-charge' && (
                        <TableCell>{it.mobileNumber || '-'}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(it)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(it)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={title === 'Site In-charge' ? 4 : 3} className="text-sm text-gray-500 text-center">No records</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Pagination footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
              <div className="text-xs text-gray-600">
                Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-8 text-xs border rounded px-2 bg-white"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value) || 10);
                    setPage(1);
                  }}
                >
                  {[5,10,20,50].map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <div className="text-xs text-gray-700">{page} / {totalPages}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default function Catalogs() {
  return (
    <div className="flex-1 p-4">
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="site-incharge">Site In-charge</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <TabsContent value="items">
            <CatalogTab 
              title="Items" 
              apiFn={() => purchaseOrderService.getAllItemNames()} 
              resourcePath={'/po_itemNames'} 
              nameKeyCandidates={["itemName", "item_name", "name"]} 
              idKeyCandidates={["id","item_id"]}
              hasAdvancedFields={true}
            />
          </TabsContent>
          <TabsContent value="models">
            <CatalogTab title="Models" apiFn={() => purchaseOrderService.getAllModels()} resourcePath={'/po_model'} nameKeyCandidates={["model", "model_name", "name"]} idKeyCandidates={["id","model_id"]} />
          </TabsContent>
          <TabsContent value="brands">
            <CatalogTab title="Brands" apiFn={() => purchaseOrderService.getAllBrands()} resourcePath={'/po_brand'} nameKeyCandidates={["brand", "brand_name", "name"]} idKeyCandidates={["id","brand_id"]} />
          </TabsContent>
          <TabsContent value="types">
            <CatalogTab title="Types" apiFn={() => purchaseOrderService.getAllTypes()} resourcePath={'/po_type'} nameKeyCandidates={["typeColor", "type_name", "name"]} idKeyCandidates={["id","type_id"]} />
          </TabsContent>
          <TabsContent value="categories">
            <CatalogTab title="Categories" apiFn={() => purchaseOrderService.getAllCategories()} resourcePath={'/po_category'} nameKeyCandidates={["category", "category_name", "name"]} idKeyCandidates={["id","category_id"]} />
          </TabsContent>
          <TabsContent value="site-incharge">
            <CatalogTab 
              title="Site In-charge" 
              apiFn={() => purchaseOrderService.getAllSiteIncharges()} 
              resourcePath={'/site_incharge'} 
              nameKeyCandidates={["siteEngineer", "name"]} 
              idKeyCandidates={["id"]}
              customFields={[
                {
                  key: 'mobileNumber',
                  label: 'Mobile Number',
                  type: 'tel',
                  placeholder: 'Enter mobile number...'
                }
              ]}
            />
          </TabsContent>
          <TabsContent value="groups">
            <CatalogTab 
              title="Groups" 
              apiFn={() => purchaseOrderService.getAllGroups()} 
              resourcePath={'/group_name'} 
              nameKeyCandidates={["group_name", "groupName", "name"]} 
              idKeyCandidates={["id","group_id"]}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}