import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Users, Building, Package, Plus, Trash2 } from "lucide-react";
import { coreApiClient } from '@/lib/api';
import { purchaseOrderService } from '@/lib/purchaseOrderService';

export function SidePanel({ isOpen, onClose, onAddItem }) {
  const [expandedSections, setExpandedSections] = useState({
    items: true
  });



  const [itemForm, setItemForm] = useState({
    selectedItemId: '',
    model: '',
    brand: '',
    item: '',
    quantity: '1',
    type: '',
    category: '',
    
  });

  // Dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState({
    models: [],
    brands: [],
    types: [],
    itemNames: [],
    categories: []
  });

  // Local search terms for each select
  const [searchModel, setSearchModel] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  // Filter helpers
  const filterModels = (list) => {
    const q = searchModel.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((m) =>
      String(m.name || m.model_name || m.id || '').toLowerCase().includes(q)
    );
  };
  const filterBrands = (list) => {
    const q = searchBrand.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((b) =>
      String(b.name || b.brand_name || b.id || '').toLowerCase().includes(q)
    );
  };
  const filterTypes = (list) => {
    const q = searchType.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((t) =>
      String(t.name || t.type_name || t.id || '').toLowerCase().includes(q)
    );
  };
  const filterItems = (list) => {
    const q = searchItem.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((i) =>
      String(i.itemName || i.name || i.id || '').toLowerCase().includes(q)
    );
  };
  const filterCategories = (list) => {
    const q = searchCategory.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((c) =>
      String(c.name || c.category_name || c.id || '').toLowerCase().includes(q)
    );
  };

  // Loading states
  const [loading, setLoading] = useState({
    models: false,
    brands: false,
    types: false,
    itemNames: false,
    categories: false
  });

  // Error states
  const [errors, setErrors] = useState({
    models: null,
    brands: null,
    types: null,
    itemNames: null,
    categories: null
  });

  // Table data states
  const [itemsList, setItemsList] = useState([]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  const handleAddItem = () => {
    if (itemForm.selectedItemId) {
      const newItem = {
        id: parseInt(itemForm.selectedItemId),
        model: itemForm.model,
        brand: itemForm.brand,
        item: itemForm.item,
        quantity: parseInt(itemForm.quantity) || 1,
        type: itemForm.type,
        category: itemForm.category,
        
      };
      setItemsList(prev => [...prev, newItem]);
      onAddItem(newItem);
      setItemForm({ 
        selectedItemId: '', 
        model: '', 
        brand: '', 
        item: '', 
        quantity: '1',
        type: '',
        category: '' 
      });
    }
  };

  // Delete functions
  const handleDeleteItem = (id) => {
    setItemsList(prev => prev.filter(item => item.id !== id));
  };

  // Load dropdown options from APIs
  useEffect(() => {
    const loadDropdownOptions = async () => {
      if (!expandedSections.items) return;
      
      // Set loading states
      setLoading({
        models: true,
        brands: true,
        types: true,
        itemNames: true,
        categories: true
      });

      try {
        // Load all dropdown data in parallel
        const [modelsResult, brandsResult, typesResult, itemNamesResult, categoriesResult] = await Promise.all([
          purchaseOrderService.getAllModels(),
          purchaseOrderService.getAllBrands(),
          purchaseOrderService.getAllTypes(),
          purchaseOrderService.getAllItemNames(),
          purchaseOrderService.getAllCategories()
        ]);

        // Update dropdown options
        setDropdownOptions({
          models: modelsResult.success ? modelsResult.data : [],
          brands: brandsResult.success ? brandsResult.data : [],
          types: typesResult.success ? typesResult.data : [],
          itemNames: itemNamesResult.success ? itemNamesResult.data : [],
          categories: categoriesResult.success ? categoriesResult.data : []
        });

        // Update error states
        setErrors({
          models: modelsResult.success ? null : modelsResult.error,
          brands: brandsResult.success ? null : brandsResult.error,
          types: typesResult.success ? null : typesResult.error,
          itemNames: itemNamesResult.success ? null : itemNamesResult.error,
          categories: categoriesResult.success ? null : categoriesResult.error
        });

      } catch (error) {
        console.error('Failed to load dropdown options:', error);
        setErrors({
          models: 'Failed to load models',
          brands: 'Failed to load brands',
          types: 'Failed to load types',
          itemNames: 'Failed to load item names',
          categories: 'Failed to load categories'
        });
      } finally {
        // Clear loading states
        setLoading({
          models: false,
          brands: false,
          types: false,
          itemNames: false,
          categories: false
        });
      }
    };

    loadDropdownOptions();
  }, [expandedSections.items]);





  return (
    <div className="w-96 bg-gray-50 border-l border-gray-200 flex-shrink-0 overflow-y-auto h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <h2 className="text-base font-medium text-gray-900">Components</h2>
      </div>

      <div className="flex-1 p-3 space-y-0 overflow-y-auto">
        {/* Items Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-100 px-2 rounded"
            onClick={() => toggleSection('items')}
          >
            <div className="flex items-center space-x-2">
              <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${!expandedSections.items ? '-rotate-90' : ''}`} />
              <span className="text-xs font-medium text-gray-700">Items</span>
            </div>
            <Plus 
              className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                handleAddItem();
              }}
            />
          </div>
          {expandedSections.items && (
            <div className="pb-3 pl-5 space-y-4">
              {/* Main Item Details Section */}
              <div className="space-y-3">
                {/* Category (moved from Other Details to top of Items) */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Category</label>
                  <Select
                    value={itemForm.category}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search category..."
                          value={searchCategory}
                          onChange={(e) => setSearchCategory(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterCategories(dropdownOptions.categories).slice(0, 10).map((category) => (
                        <SelectItem key={category.id || category.category_id} value={category.category || category.id?.toString()}>
                          {category.category || `Category ${category.id}`}
                        </SelectItem>
                      ))}
                      {filterCategories(dropdownOptions.categories).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Item */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Item</label>
                  <Select
                    value={itemForm.selectedItemId}
                    onValueChange={(value) => {
                      const selected = dropdownOptions.itemNames.find((i) => ((i.id)?.toString()) === value);
                      setItemForm(prev => ({ 
                        ...prev, 
                        selectedItemId: value,
                        item: selected?.itemName || ''
                      }));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search item..."
                          value={searchItem}
                          onChange={(e) => setSearchItem(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterItems(dropdownOptions.itemNames).slice(0, 10).map((item) => (
                        <SelectItem 
                          key={item.id || item.item_id} 
                          value={(item.id)?.toString()}
                        >
                          {item.itemName}
                        </SelectItem>
                      ))}
                      {filterItems(dropdownOptions.itemNames).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Model */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Model</label>
                  <Select
                    value={itemForm.model}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, model: value }))}
                    disabled={loading.models}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder={loading.models ? "Loading models..." : errors.models ? "Error loading models" : "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search model..."
                          value={searchModel}
                          onChange={(e) => setSearchModel(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterModels(dropdownOptions.models).length > 0 ? (
                        filterModels(dropdownOptions.models).slice(0, 10).map((model) => (
                          <SelectItem key={model.id || model.model_id} value={model.model || model.id?.toString()}>
                            {model.model || `Model ${model.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-models" disabled>No results</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Brand */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Brand</label>
                  <Select
                    value={itemForm.brand}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search brand..."
                          value={searchBrand}
                          onChange={(e) => setSearchBrand(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterBrands(dropdownOptions.brands).slice(0, 10).map((brand) => (
                        <SelectItem key={brand.id || brand.brand_id} value={brand.brand || brand.id?.toString()}>
                          {brand.brand|| `Brand ${brand.id}`}
                        </SelectItem>
                      ))}
                      {filterBrands(dropdownOptions.brands).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Types */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Type</label>
                  <Select
                    value={itemForm.type}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search type..."
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8 text-xs"
                        />
                      </div>
                      {filterTypes(dropdownOptions.types).slice(0, 10).map((type) => (
                        <SelectItem key={type.id || type.type_id} value={type.typeColor|| type.id?.toString()}>
                          {type.typeColor || `Type ${type.id}`}
                        </SelectItem>
                      ))}
                      {filterTypes(dropdownOptions.types).length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Quantity */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="h-8 text-xs border-gray-300 bg-white flex-1"
                  />
                </div>
                
              </div>

              
              
              {/* Preview (replaces items table) */}
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}