import { coreApiClient } from './api';
import { CORE_API_ENDPOINTS } from './constants';

// Purchase Order service class
class PurchaseOrderService {
  // Get all purchase orders with optional search, sort, filter, and pagination
  async getAllPurchaseOrders(params = {}) {
    try {
      let url = CORE_API_ENDPOINTS.GET_ALL_PURCHASE_ORDERS;
      
      // If any parameters are provided, send as POST with structured payload
      if (params.search || params.sort || params.filter || params.pagination || Object.keys(params).length > 0) {
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
        
        const response = await coreApiClient.post(url, payload);
        
        return {
          success: true,
          data: response.data,
        };
      } else {
        // Default GET request for all data
        const response = await coreApiClient.get(url);
        
        return {
          success: true,
          data: response.data,
        };
      }
    } catch (error) {
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
        
        return {
          success: false,
          error: message,
          status: status,
          isHttpError: true,
        };
      }

      // Handle other errors
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
      // Using POST to match the curl command structure
      const response = await coreApiClient.post('/po_model/getAll', {
        name: "Add your name in the body"
      });
      
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

  // Get all brands
  async getAllBrands() {
    try {
      // Using POST to match the curl command structure
      const response = await coreApiClient.post('/po_brand/getAll', {
        name: "Add your name in the body"
      });
      
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