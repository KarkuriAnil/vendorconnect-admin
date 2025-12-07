import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = 'https://apiabhiproject.lytortech.com/api/admin';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProductItem {
  id: number;
  name: string;
  imageUrl?: string;
  mrp: number;
  genPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceVendor {
  id: number;
  vendorName: string;
  centerName: string;
  phoneNumber: string;
  username: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppCustomer {
  id: number;
  uid: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVendorMap {
  id: number;
  customer: AppCustomer;
  vendor: ServiceVendor;
  assignedAt: string;
  assignedBy: string;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  customer: AppCustomer;
  vendor: ServiceVendor;
  item: ProductItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress?: string;
  notes?: string;
  paymentUpdatedBy?: string;
  paymentUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Item Management
export const itemsApi = {
  getAll: () => api.get<ApiResponse<ProductItem[]>>('/items'),
  create: (data: Partial<ProductItem>) => api.post<ApiResponse<ProductItem>>('/items', data),
  update: (id: number, data: Partial<ProductItem>) => api.put<ApiResponse<ProductItem>>(`/items/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/items/${id}`),
};

// Vendor Management
export const vendorsApi = {
  getAll: () => api.get<ApiResponse<ServiceVendor[]>>('/vendors'),
  create: (data: { vendorName: string; centerName: string; phoneNumber: string; username: string; password: string }) =>
    api.post<ApiResponse<ServiceVendor>>('/vendors', data),
};

// Assignment Management
export const assignmentsApi = {
  getAll: () => api.get<ApiResponse<CustomerVendorMap[]>>('/assignments'),
  assign: (data: { customerId: number; vendorId: number; assignedBy: string }) =>
    api.post<ApiResponse<CustomerVendorMap>>('/assignments', data),
  reassign: (customerId: number, newVendorId: number) =>
    api.put<ApiResponse<null>>(`/assignments/reassign/${customerId}?newVendorId=${newVendorId}`),
};

// Order Management
export const ordersApi = {
  getAll: () => api.get<ApiResponse<PurchaseOrder[]>>('/orders'),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get<ApiResponse<PurchaseOrder[]>>(`/orders/date-range?startDate=${startDate}&endDate=${endDate}`),
  export: async (startDate: string, endDate: string) => {
    const response = await api.get(`/orders/export?startDate=${startDate}&endDate=${endDate}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_${startDate}_${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<{ token: string }>>('/auth/login', { username, password }),
};

export default api;
