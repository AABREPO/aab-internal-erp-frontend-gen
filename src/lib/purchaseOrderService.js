import { coreApiClient } from './api';
import { metaApiClient } from './metaApi';
import { CORE_API_ENDPOINTS, META_API_ENDPOINTS } from './constants';

// Purchase Order service class
class PurchaseOrderService {
  // Get all purchase orders with optional search, sort, filter, and pagination
  async getAllPurchaseOrders(params = {}) {
    try {
      let url = CORE_API_ENDPOINTS.GET_ALL_PURCHASE_ORDERS;
      
      // Check if we have meaningful parameters (not just empty objects)
      const hasParams = params && (
        params.search || 
        (params.sort && (params.sort.field || params.sort.order)) || 
        (params.filter && Object.keys(params.filter).length > 0) || 
        (params.pagination && (params.pagination.limit || params.pagination.page))
      );
      
      if (hasParams) {
        // Send as POST with structured payload when we have actual parameters
        const payload = {
          search: params.search || '',
          sort: params.sort || {
            field: 'eno',
            order: 'asc'
          },
          filter: params.filter || {},
          pagination: params.pagination || {
            limit: 50,
            page: 1,
            start: 0,
            end: 50
          }
        };
        
        console.log('Making POST request with payload:', payload);
        const response = await coreApiClient.post(url, payload);
        
        return {
          success: true,
          data: response.data,
        };
      } else {
        // Always use POST, but with empty params for getting all data
        console.log('Making POST request with empty params for all data');
        const response = await coreApiClient.post(url, {});
        
        return {
          success: true,
          data: response.data,
        };
      }
    } catch (error) {
      console.error('Purchase Order Service Error:', error);
      
      // Handle CORS errors specifically
      if (error.isCorsError) {
        return {
          success: false,
          error: 'CORS Error: Unable to connect to the server. Please check if the server is running and accessible.',
          isCorsError: true,
        };
      }

      // Handle network errors
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: 'Network Error: Unable to connect to the server. Please check your internet connection.',
          isNetworkError: true,
        };
      }

      // Handle HTTP errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Failed to fetch purchase orders';
        
        console.error('HTTP Error Details:', {
          status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method
        });
        
        return {
          success: false,
          error: message,
          status: status,
          isHttpError: true,
        };
      }

      // Handle other errors
      console.error('Other Error Details:', {
        message: error.message,
        stack: error.stack,
        config: error.config
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase orders. Please try again.',
        isOtherError: true,
      };
    }
  }

  // Get purchase order by ID (for edit/view with full details)
  async getPurchaseOrderById(id) {
    try {
      const response = await coreApiClient.get(`${CORE_API_ENDPOINTS.GET_PURCHASE_ORDER_DETAILS}/${id}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch purchase order details',
      };
    }
  }

  // Create new purchase order
  async createPurchaseOrder(purchaseOrderData) {
    try {
      const response = await coreApiClient.post(CORE_API_ENDPOINTS.CREATE_PURCHASE_ORDER, purchaseOrderData);
      
      return {
        success: true,
        data: response.data,
        message: 'Purchase order created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create purchase order',
      };
    }
  }

  // Update purchase order
  async updatePurchaseOrder(id, purchaseOrderData) {
    try {
      const response = await coreApiClient.put(`${CORE_API_ENDPOINTS.UPDATE_PURCHASE_ORDER}/${id}`, purchaseOrderData);
      
      return {
        success: true,
        data: response.data,
        message: 'Purchase order updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update purchase order',
      };
    }
  }

  // Delete purchase order
  async deletePurchaseOrder(id) {
    try {
      const response = await coreApiClient.delete(`${CORE_API_ENDPOINTS.DELETE_PURCHASE_ORDER}/${id}`);
      
      return {
        success: true,
        message: 'Purchase order deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete purchase order',
      };
    }
  }

  // Validate purchase order data
  validatePurchaseOrderData(data) {
    const errors = [];

    // Required fields validation
    if (!data.eno) errors.push('Purchase Order Number (ENO) is required');
    if (!data.vendor_id) errors.push('Vendor ID is required');
    if (!data.client_id) errors.push('Client ID is required');
    if (!data.site_incharge_id) errors.push('Site Incharge ID is required');
    if (!data.date) errors.push('Date is required');
    if (!data.site_incharge_mobile_number) errors.push('Site Incharge Mobile Number is required');

    // Date validation
    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
    }

    // Mobile number validation
    if (data.site_incharge_mobile_number) {
      const mobileRegex = /^[0-9]{10,15}$/;
      if (!mobileRegex.test(data.site_incharge_mobile_number)) {
        errors.push('Invalid mobile number format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get all models
  async getAllModels() {
    try {
      // Using GET as per API
      const response = await coreApiClient.get('/po_model/getAll');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch models',
      };
    }
  }

  // Utility: Get model name by id
  async getModelNameById(modelId) {
    try {
      if (modelId == null) return null;
      const result = await this.getAllModels();
      if (!result.success || !Array.isArray(result.data)) return null;
      const match = result.data.find(
        (m) => (m.id ?? m.model_id)?.toString() === modelId.toString()
      );
      return match?.name || match?.model_name || null;
    } catch (e) {
      return null;
    }
  }

  // Get all brands
  async getAllBrands() {
    try {
      // Using GET as per API
      const response = await coreApiClient.get('/po_brand/getAll');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch brands',
      };
    }
  }

  // Get all types
  async getAllTypes() {
    try {
      const response = await coreApiClient.get('/po_type/getAll');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch types',
      };
    }
  }

  // Get all item names
  async getAllItemNames() {
    try {
      const response = await coreApiClient.get('/po_itemNames/getAll');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch item names',
      };
    }
  }

  // Get all categories
  async getAllCategories() {
    try {
      const response = await coreApiClient.get('/po_category/getAll');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  }

  // Get all site incharges
  async getAllSiteIncharges() {
    try {
      const response = await coreApiClient.get('/site_incharge/getAll');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch site incharges',
      };
    }
  }

  // Get all groups
  async getAllGroups() {
    try {
      const response = await coreApiClient.get('/po_group/getAll');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch groups',
      };
    }
  }

  // Search helpers with optional limit (backend may ignore params; frontend can still slice)
  async searchSiteIncharges(query, limit = 10) {
    try {
      const response = await coreApiClient.get('/site_incharge/getAll', {
        params: { q: query, limit }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.slice(0, limit) };
    } catch (error) {
      return { success: false, error: 'Failed to search site incharges' };
    }
  }

  // Get all vendor names
  async getAllVendorNames() {
    try {
      const response = await metaApiClient.get(META_API_ENDPOINTS.VENDOR_NAMES);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vendor Names API Error:', error);
      
      // Handle different error types
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: 'Network Error: Unable to connect to the vendor service. Please check your internet connection.',
          isNetworkError: true,
        };
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Failed to fetch vendor names';
        
        return {
          success: false,
          error: message,
          status: status,
          isHttpError: true,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch vendor names',
      };
    }
  }

  async searchVendors(query, limit = 10) {
    try {
      const response = await metaApiClient.get(META_API_ENDPOINTS.VENDOR_NAMES, {
        params: { q: query, limit }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.slice(0, limit) };
    } catch (error) {
      return { success: false, error: 'Failed to search vendors' };
    }
  }

  async getAllProjects() {
    try {
      const response = await metaApiClient.get('/project_Names/getAll');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch projects' };
    }
  }

  async searchProjects(query, limit = 10) {
    try {
      const response = await metaApiClient.get('/project_Names/getAll', {
        params: { q: query, limit }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: data.slice(0, limit) };
    } catch (error) {
      return { success: false, error: 'Failed to search projects' };
    }
  }

  // Generic CRUD helpers for catalogs
  async createCatalogItem(resourcePath, payload) {
    try {
      const response = await coreApiClient.post(`${resourcePath}/create`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Create failed' };
    }
  }

  async updateCatalogItem(resourcePath, id, payload) {
    try {
      const response = await coreApiClient.put(`${resourcePath}/update/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
  }

  async deleteCatalogItem(resourcePath, id) {
    try {
      const response = await coreApiClient.delete(`${resourcePath}/delete/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Delete failed' };
    }
  }

  // Format purchase order data for API
  formatPurchaseOrderData(data) {
    return {
      id: data.id || null,
      eno: data.eno,
      vendor_id: parseInt(data.vendor_id),
      client_id: parseInt(data.client_id),
      site_incharge_id: parseInt(data.site_incharge_id),
      date: data.date,
      site_incharge_mobile_number: data.site_incharge_mobile_number,
      created_by: data.created_by || 'admin',
      created_date_time: data.created_date_time || new Date().toISOString(),
      delete_status: data.delete_status || false,
      purchase_table: data.purchase_table || [],
      po_notes: data.po_notes || null,
    };
  }
}

// Create and export singleton instance
const purchaseOrderService = new PurchaseOrderService();
export { purchaseOrderService };
export default purchaseOrderService; 