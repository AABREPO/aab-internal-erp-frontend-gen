import { useState, useEffect, useMemo } from 'react';
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

  // Memoized filter helpers with lazy loading (10 items max) and category-based filtering
  const filteredModels = useMemo(() => {
    const q = searchModel.trim().toLowerCase();
    let items = dropdownOptions.models || [];
    
    // Filter by category first if category is selected
    if (itemForm.category) {
      items = items.filter(m => 
        (m.category_id || m.categoryId)?.toString() === itemForm.category
      );
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((m) =>
        String(m.model || m.model_name || m.name || m.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.models, searchModel, itemForm.category]);
  
  const filteredBrands = useMemo(() => {
    const q = searchBrand.trim().toLowerCase();
    let items = dropdownOptions.brands || [];
    
    // Filter by category first if category is selected
    if (itemForm.category) {
      items = items.filter(b => 
        (b.category_id || b.categoryId)?.toString() === itemForm.category
      );
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((b) =>
        String(b.brand || b.brand_name || b.name || b.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.brands, searchBrand, itemForm.category]);
  
  const filteredTypes = useMemo(() => {
    const q = searchType.trim().toLowerCase();
    let items = dropdownOptions.types || [];
    
    // Filter by category first if category is selected
    if (itemForm.category) {
      items = items.filter(t => 
        (t.category_id || t.categoryId)?.toString() === itemForm.category
      );
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((t) =>
        String(t.typeColor || t.type_name || t.name || t.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.types, searchType, itemForm.category]);
  
  const filteredItems = useMemo(() => {
    const q = searchItem.trim().toLowerCase();
    let items = dropdownOptions.itemNames || [];
    
    // Filter by category first if category is selected
    if (itemForm.category) {
      items = items.filter(i => 
        (i.category_id || i.categoryId)?.toString() === itemForm.category
      );
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((i) =>
        String(i.itemName || i.item_name || i.name || i.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.itemNames, searchItem, itemForm.category]);
  
  const filteredCategories = useMemo(() => {
    const q = searchCategory.trim().toLowerCase();
    const items = dropdownOptions.categories || [];
    if (!q) return items.slice(0, 10);
    return items
      .filter((c) =>
        String(c.category || c.category_name || c.name || c.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.categories, searchCategory]);

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
      // Find the selected objects to get both IDs and display names
      const selectedModel = dropdownOptions.models.find(m => 
        (m.id || m.model_id)?.toString() === itemForm.model
      );
      const selectedBrand = dropdownOptions.brands.find(b => 
        (b.id || b.brand_id)?.toString() === itemForm.brand
      );
      const selectedType = dropdownOptions.types.find(t => 
        (t.id || t.type_id)?.toString() === itemForm.type
      );
      const selectedCategory = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === itemForm.category
      );
      const selectedItem = dropdownOptions.itemNames.find(i => 
        (i.id || i.item_id)?.toString() === itemForm.selectedItemId
      );

      const newItem = {
        // Main item info
        id: parseInt(itemForm.selectedItemId),
        item: selectedItem?.itemName || selectedItem?.item_name || itemForm.item,
        quantity: parseInt(itemForm.quantity) || 1,
        
        // API required ID fields
        item_id: parseInt(itemForm.selectedItemId),
        model_id: selectedModel ? parseInt(selectedModel.id || selectedModel.model_id) : null,
        brand_id: selectedBrand ? parseInt(selectedBrand.id || selectedBrand.brand_id) : null,
        type_id: selectedType ? parseInt(selectedType.id || selectedType.type_id) : null,
        category_id: selectedCategory ? parseInt(selectedCategory.id || selectedCategory.category_id) : null,
        
        // Display names for UI
        model: selectedModel?.model || selectedModel?.model_name || '',
        brand: selectedBrand?.brand || selectedBrand?.brand_name || '',
        type: selectedType?.typeColor || selectedType?.type_name || '',
        category: selectedCategory?.category || selectedCategory?.category_name || '',
      };
      
      console.log('SidePanel adding item with proper IDs:', newItem);
      
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

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && itemForm.selectedItemId) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Handle category change - reset other fields when category changes
  const handleCategoryChange = (value) => {
    setItemForm(prev => ({ 
      ...prev, 
      category: value,
      // Reset other fields when category changes
      selectedItemId: '',
      model: '',
      brand: '',
      type: '',
      item: ''
    }));
    
    // Clear search terms for dependent fields
    setSearchModel('');
    setSearchBrand('');
    setSearchType('');
    setSearchItem('');
  };

  // Delete functions
  const handleDeleteItem = (id) => {
    setItemsList(prev => prev.filter(item => item.id !== id));
  };

  // Load dropdown options from APIs
  useEffect(() => {
    const loadDropdownOptions = async () => {
      if (!expandedSections.items) return;
      
      console.log('Loading dropdown options...');
      
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

        console.log('API Results:', {
          models: modelsResult,
          brands: brandsResult,
          types: typesResult,
          itemNames: itemNamesResult,
          categories: categoriesResult
        });

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

        console.log('Dropdown options loaded:', {
          modelsCount: modelsResult.success ? modelsResult.data.length : 0,
          brandsCount: brandsResult.success ? brandsResult.data.length : 0,
          typesCount: typesResult.success ? typesResult.data.length : 0,
          itemNamesCount: itemNamesResult.success ? itemNamesResult.data.length : 0,
          categoriesCount: categoriesResult.success ? categoriesResult.data.length : 0
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
                    onValueChange={handleCategoryChange}
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
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id || category.category_id} value={(category.id || category.category_id)?.toString()}>
                          {category.category || category.category_name || `Category ${category.id}`}
                        </SelectItem>
                      ))}
                      {filteredCategories.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Model</label>
                  <Select
                    value={itemForm.model}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, model: value }))}
                    disabled={loading.models}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder={
                        loading.models ? "Loading models..." : 
                        errors.models ? "Error loading models" : 
                        itemForm.category ? "Select model (filtered by category)" : 
                        "Select model"
                      } />
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
                      {filteredModels.map((model) => (
                        <SelectItem 
                          key={model.id || model.model_id} 
                          value={(model.id || model.model_id)?.toString()}
                        >
                          {model.model || model.model_name || `Model ${model.id}`}
                        </SelectItem>
                      ))}
                      {filteredModels.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
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
                      <SelectValue placeholder={itemForm.category ? "Select brand (filtered by category)" : "Select brand"} />
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
                      {filteredBrands.map((brand) => (
                        <SelectItem 
                          key={brand.id || brand.brand_id} 
                          value={(brand.id || brand.brand_id)?.toString()}
                        >
                          {brand.brand || brand.brand_name || `Brand ${brand.id}`}
                        </SelectItem>
                      ))}
                      {filteredBrands.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
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
                      <SelectValue placeholder={itemForm.category ? "Select item (filtered by category)" : "Select item"} />
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
                      {filteredItems.map((item) => (
                        <SelectItem 
                          key={item.id || item.item_id} 
                          value={(item.id)?.toString()}
                        >
                          {item.itemName || item.item_name || `Item ${item.id}`}
                        </SelectItem>
                      ))}
                      {filteredItems.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-xs border-gray-300 bg-white flex-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Type</label>
                  <Select
                    value={itemForm.type}
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                      <SelectValue placeholder={itemForm.category ? "Select type (filtered by category)" : "Select type"} />
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
                      {filteredTypes.map((type) => (
                        <SelectItem 
                          key={type.id || type.type_id} 
                          value={(type.id || type.type_id)?.toString()}
                        >
                          {type.typeColor || type.type_name || `Type ${type.id}`}
                        </SelectItem>
                      ))}
                      {filteredTypes.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">No results</div>
                      )}
                    </SelectContent>
                  </Select>
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