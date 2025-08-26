import { useState, useEffect, useMemo, useRef } from 'react';
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
    selectedItemName: '',
    modelId: '',
    modelName: '',
    brandId: '',
    brandName: '',
    typeId: '',
    typeName: '',
    categoryId: '',
    categoryName: '',
    quantity: '1'
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

  // Keyboard navigation state for each select
  const [selectedIndices, setSelectedIndices] = useState({
    category: -1,
    model: -1,
    brand: -1,
    item: -1,
    type: -1
  });

  // Refs for select content containers
  const selectRefs = {
    category: useRef(null),
    model: useRef(null),
    brand: useRef(null),
    item: useRef(null),
    type: useRef(null)
  };

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
          const value = (selectedItem.id || selectedItem.category_id || selectedItem.model_id || selectedItem.brand_id || selectedItem.type_id || selectedItem.item_id)?.toString();
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

  // Memoized filter helpers with lazy loading (10 items max) and category-based filtering
  const filteredModels = useMemo(() => {
    const q = searchModel.trim().toLowerCase();
    let items = dropdownOptions.models || [];
    
    // Filter by category first if category is selected
    if (itemForm.categoryId) {
      items = items.filter(m => {
        // Use category name for comparison since itemForm.category stores the name
        const itemCategory = m.category || m.category_name || m.categoryName;
        const matches = itemCategory?.toString() === itemForm.categoryName;
        if (matches) {
          console.log('Model matches category:', m, 'category field:', itemCategory);
        }
        return matches;
      });
      console.log(`Filtered models for category ${itemForm.categoryName}:`, items.length, 'items');
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((m) =>
        String(m.model || m.model_name || m.name || m.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.models, searchModel, itemForm.categoryId]);
  
  const filteredBrands = useMemo(() => {
    const q = searchBrand.trim().toLowerCase();
    let items = dropdownOptions.brands || [];
    
    // Filter by category first if category is selected
    if (itemForm.categoryId) {
      items = items.filter(b => {
        // Use category name for comparison since itemForm.category stores the name
        const itemCategory = b.category || b.category_name || b.categoryName;
        const matches = itemCategory?.toString() === itemForm.categoryName;
        if (matches) {
          console.log('Brand matches category:', b, 'category field:', itemCategory);
        }
        return matches;
      });
      console.log(`Filtered brands for category ${itemForm.categoryName}:`, items.length, 'items');
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((b) =>
        String(b.brand || b.brand_name || b.name || b.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.brands, searchBrand, itemForm.categoryId]);
  
  const filteredTypes = useMemo(() => {
    const q = searchType.trim().toLowerCase();
    let items = dropdownOptions.types || [];
    
    // Filter by category first if category is selected
    if (itemForm.categoryId) {
      items = items.filter(t => {
        // Use category name for comparison since itemForm.category stores the name
        const itemCategory = t.category || t.category_name || t.categoryName;
        const matches = itemCategory?.toString() === itemForm.categoryName;
        if (matches) {
          console.log('Type matches category:', t, 'category field:', itemCategory);
        }
        return matches;
      });
      console.log(`Filtered types for category ${itemForm.categoryName}:`, items.length, 'items');
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((t) =>
        String(t.typeColor || t.type_name || t.name || t.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.types, searchType, itemForm.categoryId]);
  
  const filteredItems = useMemo(() => {
    const q = searchItem.trim().toLowerCase();
    let items = dropdownOptions.itemNames || [];
    
    // Filter by category first if category is selected
    if (itemForm.categoryId) {
      items = items.filter(i => {
        // Use category name for comparison since itemForm.category stores the name
        const itemCategory = i.category || i.category_name || i.categoryName;
        const matches = itemCategory?.toString() === itemForm.categoryName;
        if (matches) {
          console.log('Item matches category:', i, 'category field:', itemCategory);
        }
        return matches;
      });
      console.log(`Filtered items for category ${itemForm.categoryName}:`, items.length, 'items');
    }
    
    // Then filter by search query
    if (!q) return items.slice(0, 10);
    return items
      .filter((i) =>
        String(i.itemName || i.item_name || i.name || i.id || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [dropdownOptions.itemNames, searchItem, itemForm.categoryId]);
  
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
        (m.id || m.model_id)?.toString() === itemForm.modelId
      );
      const selectedBrand = dropdownOptions.brands.find(b => 
        (b.id || b.brand_id)?.toString() === itemForm.brandId
      );
      const selectedType = dropdownOptions.types.find(t => 
        (t.id || t.type_id)?.toString() === itemForm.typeId
      );
      const selectedCategory = dropdownOptions.categories.find(c => 
        (c.id || c.category_id)?.toString() === itemForm.categoryId
      );
      const selectedItem = dropdownOptions.itemNames.find(i => 
        (i.id || i.item_id)?.toString() === itemForm.selectedItemId
      );

      const newItem = {
        // Main item info
        id: parseInt(itemForm.selectedItemId),
        item: selectedItem?.itemName || selectedItem?.item_name || itemForm.selectedItemName,
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
        selectedItemName: '',
        modelId: '', 
        modelName: '',
        brandId: '', 
        brandName: '',
        typeId: '', 
        typeName: '',
        categoryId: '', 
        categoryName: '',
        quantity: '1'
      });
    }
  };

  // Handle Enter key press for quantity input
  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter' && itemForm.selectedItemId) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Debug function to log data structure
  const debugDataStructure = () => {
    console.log('=== DEBUG DATA STRUCTURE ===');
    console.log('Categories:', dropdownOptions.categories);
    console.log('Models:', dropdownOptions.models);
    console.log('Brands:', dropdownOptions.brands);
    console.log('Types:', dropdownOptions.types);
    console.log('Items:', dropdownOptions.itemNames);
    
    if (itemForm.categoryId) {
      console.log('Selected Category Name:', itemForm.categoryName);
      const selectedCategory = dropdownOptions.categories.find(c => 
        (c.category || c.category_name)?.toString() === itemForm.categoryName
      );
      console.log('Selected Category Object:', selectedCategory);
      console.log('Selected Category ID:', selectedCategory?.id || selectedCategory?.category_id);
    }
    
    // Log sample items from each category to understand the data structure
    console.log('=== SAMPLE ITEMS BY CATEGORY ===');
    dropdownOptions.categories.forEach(cat => {
      const catName = cat.category || cat.category_name;
      const catId = cat.id || cat.category_id;
      
      const modelsInCat = dropdownOptions.models.filter(m => 
        (m.category || m.category_name)?.toString() === catName?.toString()
      );
      const brandsInCat = dropdownOptions.brands.filter(b => 
        (b.category || b.category_name)?.toString() === catName?.toString()
      );
      const typesInCat = dropdownOptions.types.filter(t => 
        (t.category || t.category_name)?.toString() === catName?.toString()
      );
      const itemsInCat = dropdownOptions.itemNames.filter(i => 
        (i.category || i.category_name)?.toString() === catName?.toString()
      );
      
      console.log(`Category "${catName}" (ID: ${catId}):`, {
        models: modelsInCat.length,
        brands: brandsInCat.length,
        types: typesInCat.length,
        items: itemsInCat.length,
        sampleModel: modelsInCat[0],
        sampleBrand: brandsInCat[0],
        sampleType: typesInCat[0],
        sampleItem: itemsInCat[0]
      });
    });
  };

  // Handle category change with debugging
  const handleCategoryChange = (categoryId) => {
    console.log('=== CATEGORY CHANGE ===');
    console.log('Previous category:', itemForm.categoryName);
    console.log('New category ID:', categoryId);
    
    // Find the selected category to get both ID and name
    const selectedCategory = dropdownOptions.categories.find(c => 
      (c.id || c.category_id)?.toString() === categoryId
    );
    
    // Clear dependent fields
    setItemForm(prev => ({
      ...prev,
      categoryId: categoryId,
      categoryName: selectedCategory?.category || selectedCategory?.category_name || '',
      selectedItemId: '',
      selectedItemName: '',
      modelId: '',
      modelName: '',
      brandId: '',
      brandName: '',
      typeId: '',
      typeName: '',
      quantity: '1'
    }));
    
    // Clear search terms
    setSearchModel('');
    setSearchBrand('');
    setSearchType('');
    setSearchItem('');
    
    // Reset keyboard navigation indices
    setSelectedIndices({
      category: 0,
      model: 0,
      brand: 0,
      item: 0,
      type: 0
    });
    
    // Debug the data structure when category changes
    setTimeout(() => {
      debugDataStructure();
    }, 100);
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

        // Debug: Log sample data structure
        if (modelsResult.success && modelsResult.data.length > 0) {
          console.log('Sample model data structure:', modelsResult.data[0]);
        }
        if (brandsResult.success && brandsResult.data.length > 0) {
          console.log('Sample brand data structure:', brandsResult.data[0]);
        }
        if (typesResult.success && typesResult.data.length > 0) {
          console.log('Sample type data structure:', typesResult.data[0]);
        }
        if (itemNamesResult.success && itemNamesResult.data.length > 0) {
          console.log('Sample item data structure:', itemNamesResult.data[0]);
        }
        if (categoriesResult.success && categoriesResult.data.length > 0) {
          console.log('Sample category data structure:', categoriesResult.data[0]);
        }

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

        // Debug the complete data structure after loading
        setTimeout(() => {
          console.log('=== INITIAL DATA LOAD COMPLETE ===');
          debugDataStructure();
        }, 200);

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
                {/* Category */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Category</label>
                  <div className="flex-1 relative">
                    <Select
                      value={itemForm.categoryId}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search category... (↑↓ to navigate, Enter to select)"
                            value={searchCategory}
                            onChange={(e) => handleSearchChange(setSearchCategory, e.target.value, 'category')}
                            onKeyDown={(e) => handleKeyDown('category', e, filteredCategories, handleCategoryChange)}
                            onPointerDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredCategories.map((category, index) => (
                          <SelectItem 
                            key={category.id || category.category_id} 
                            value={(category.id || category.category_id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.category === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {category.category || category.category_name || `Category ${category.id}`}
                          </SelectItem>
                        ))}
                        {filteredCategories.length === 0 && (
                          <div className="p-2 text-xs text-gray-500">No results</div>
                        )}
                      </SelectContent>
                    </Select>
                    {itemForm.categoryId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryChange('')}
                        className="absolute right-1 top-0 h-6 w-6 p-0 text-xs"
                        title="Clear category filter"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>

                {/* Model */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Model</label>
                  <div className="flex-1 relative">
                    <Select
                      value={itemForm.modelId}
                      onValueChange={(value) => {
                        const selected = dropdownOptions.models.find((m) => ((m.id || m.model_id)?.toString()) === value);
                        setItemForm(prev => ({ 
                          ...prev, 
                          modelId: value,
                          modelName: selected?.model || selected?.model_name || ''
                        }));
                      }}
                      disabled={loading.models}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                        <SelectValue placeholder={
                          loading.models ? "Loading models..." : 
                          errors.models ? "Error loading models" : 
                          itemForm.categoryId ? `Select model (${filteredModels.length} available)` : 
                          "Select model"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search model... (↑↓ to navigate, Enter to select)"
                            value={searchModel}
                            onChange={(e) => handleSearchChange(setSearchModel, e.target.value, 'model')}
                            onKeyDown={(e) => handleKeyDown('model', e, filteredModels, (value) => {
                              const selected = dropdownOptions.models.find((m) => ((m.id || m.model_id)?.toString()) === value);
                              setItemForm(prev => ({ 
                                ...prev, 
                                modelId: value,
                                modelName: selected?.model || selected?.model_name || ''
                              }));
                            })}
                            onPointerDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredModels.map((model, index) => (
                          <SelectItem 
                            key={model.id || model.model_id} 
                            value={(model.id || model.model_id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.model === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {model.model || model.model_name || `Model ${model.id}`}
                          </SelectItem>
                        ))}
                        {filteredModels.length === 0 && (
                          <div className="p-2 text-xs text-gray-500">
                            {itemForm.categoryId ? "No models found for selected category" : "No results"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {itemForm.categoryId && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Filtered by category"></div>
                    )}
                  </div>
                </div>

                {/* Brand */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Brand</label>
                  <div className="flex-1 relative">
                    <Select
                      value={itemForm.brandId}
                      onValueChange={(value) => setItemForm(prev => ({ ...prev, brandId: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                        <SelectValue placeholder={itemForm.categoryId ? `Select brand (${filteredBrands.length} available)` : "Select brand"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search brand... (↑↓ to navigate, Enter to select)"
                            value={searchBrand}
                            onChange={(e) => handleSearchChange(setSearchBrand, e.target.value, 'brand')}
                            onKeyDown={(e) => handleKeyDown('brand', e, filteredBrands, (value) => {
                              const selected = dropdownOptions.brands.find((b) => ((b.id || b.brand_id)?.toString()) === value);
                              setItemForm(prev => ({ 
                                ...prev, 
                                brandId: value,
                                brandName: selected?.brand || selected?.brand_name || ''
                              }));
                            })}
                            onPointerDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredBrands.map((brand, index) => (
                          <SelectItem 
                            key={brand.id || brand.brand_id} 
                            value={(brand.id || brand.brand_id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.brand === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {brand.brand || brand.brand_name || `Brand ${brand.id}`}
                          </SelectItem>
                        ))}
                        {filteredBrands.length === 0 && (
                          <div className="p-2 text-xs text-gray-500">
                            {itemForm.categoryId ? "No brands found for selected category" : "No results"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {itemForm.categoryId && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Filtered by category"></div>
                    )}
                  </div>
                </div>
                
                {/* Item */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Item</label>
                  <div className="flex-1 relative">
                    <Select
                      value={itemForm.selectedItemId}
                      onValueChange={(value) => {
                        const selected = dropdownOptions.itemNames.find((i) => ((i.id)?.toString()) === value);
                        setItemForm(prev => ({ 
                          ...prev, 
                          selectedItemId: value,
                          selectedItemName: selected?.itemName || selected?.item_name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                        <SelectValue placeholder={itemForm.categoryId ? `Select item (${filteredItems.length} available)` : "Select item"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search item... (↑↓ to navigate, Enter to select)"
                            value={searchItem}
                            onChange={(e) => handleSearchChange(setSearchItem, e.target.value, 'item')}
                            onKeyDown={(e) => handleKeyDown('item', e, filteredItems, (value) => {
                              const selected = dropdownOptions.itemNames.find((i) => ((i.id)?.toString()) === value);
                              setItemForm(prev => ({ 
                                ...prev, 
                                selectedItemId: value,
                                selectedItemName: selected?.itemName || selected?.item_name || ''
                              }));
                            })}
                            onPointerDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredItems.map((item, index) => (
                          <SelectItem 
                            key={item.id || item.item_id} 
                            value={(item.id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.item === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {item.itemName || item.item_name || `Item ${item.id}`}
                          </SelectItem>
                        ))}
                        {filteredItems.length === 0 && (
                          <div className="p-2 text-xs text-gray-500">
                            {itemForm.categoryId ? "No items found for selected category" : "No results"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {itemForm.categoryId && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Filtered by category"></div>
                    )}
                  </div>
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
                    onKeyDown={handleQuantityKeyDown}
                    className="h-8 text-xs border-gray-300 bg-white flex-1"
                  />
                </div>

                {/* Type */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-thin text-gray-600 w-16 flex-shrink-0">Type</label>
                  <div className="flex-1 relative">
                    <Select
                      value={itemForm.typeId}
                      onValueChange={(value) => {
                        const selected = dropdownOptions.types.find((t) => ((t.id || t.type_id)?.toString()) === value);
                        setItemForm(prev => ({ 
                          ...prev, 
                          typeId: value,
                          typeName: selected?.typeColor || selected?.type_name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300 bg-white flex-1">
                        <SelectValue placeholder={itemForm.categoryId ? `Select type (${filteredTypes.length} available)` : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search type... (↑↓ to navigate, Enter to select)"
                            value={searchType}
                            onChange={(e) => handleSearchChange(setSearchType, e.target.value, 'type')}
                            onKeyDown={(e) => handleKeyDown('type', e, filteredTypes, (value) => {
                              const selected = dropdownOptions.types.find((t) => ((t.id || t.type_id)?.toString()) === value);
                              setItemForm(prev => ({ 
                                ...prev, 
                                typeId: value,
                                typeName: selected?.typeColor || selected?.type_name || ''
                              }));
                            })}
                            onPointerDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 text-xs"
                          />
                        </div>
                        {filteredTypes.map((type, index) => (
                          <SelectItem 
                            key={type.id || type.type_id} 
                            value={(type.id || type.type_id)?.toString()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`${selectedIndices.type === index ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {type.typeColor || type.type_name || `Type ${type.id}`}
                          </SelectItem>
                        ))}
                        {filteredTypes.length === 0 && (
                          <div className="p-2 text-xs text-gray-500">
                            {itemForm.categoryId ? "No types found for selected category" : "No results"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {itemForm.categoryId && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" title="Filtered by category"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}