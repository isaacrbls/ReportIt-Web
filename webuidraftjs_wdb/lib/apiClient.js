// Hybrid API client that works with both Firebase and Django
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class HybridApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.access);
    return response;
  }

  async register(userData) {
    return await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.request('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });

    this.setToken(response.access);
    return response;
  }

  async getCurrentUser() {
    return await this.request('/auth/current-user/');
  }

  async requestPasswordReset(email) {
    return await this.request('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return await this.request('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyCaptcha(token) {
    return await this.request('/auth/verify-captcha/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Reports methods
  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/reports/${queryString ? `?${queryString}` : ''}`);
  }

  async getReport(id) {
    return await this.request(`/reports/${id}/`);
  }

  async createReport(reportData) {
    const formData = new FormData();
    
    Object.keys(reportData).forEach(key => {
      if (reportData[key] !== null && reportData[key] !== undefined) {
        formData.append(key, reportData[key]);
      }
    });

    return await this.request('/reports/', {
      method: 'POST',
      body: formData,
    });
  }

  async updateReport(id, reportData) {
    return await this.request(`/reports/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(id) {
    return await this.request(`/reports/${id}/`, {
      method: 'DELETE',
    });
  }

  async verifyReport(id, notes = '') {
    return await this.request(`/reports/${id}/verify/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectReport(id, notes = '') {
    return await this.request(`/reports/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async updateReportStatus(id, status, notes = '') {
    return await this.request(`/reports/${id}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Categories methods
  async getCategories() {
    return await this.request('/categories/');
  }

  async createCategory(categoryData) {
    return await this.request('/categories/', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // Analytics methods
  async getAnalyticsStats() {
    return await this.request('/analytics/stats/');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('refresh_token');
  }
}

// Create a singleton instance
export const apiClient = new HybridApiClient();
export default apiClient;