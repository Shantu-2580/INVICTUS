// Real API Service - Connects to Backend
const API_BASE_URL = 'http://localhost:5000/api';

class RealAPI {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to get headers with auth token
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method to handle responses
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Authentication
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password })
    });

    const data = await this.handleResponse(response);

    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ name, email, password, role: 'admin' })
    });

    const data = await this.handleResponse(response);

    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Components
  async getComponents() {
    const response = await fetch(`${API_BASE_URL}/components`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.components || [];
  }

  async addComponent(component) {
    const response = await fetch(`${API_BASE_URL}/components`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: component.name,
        part_number: component.partNumber,
        current_stock: component.currentStock,
        monthly_required_quantity: component.monthlyRequired
      })
    });

    const data = await this.handleResponse(response);
    return data.data.component;
  }

  async updateComponent(id, updates) {
    const response = await fetch(`${API_BASE_URL}/components/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: updates.name,
        part_number: updates.partNumber,
        current_stock: updates.currentStock,
        monthly_required_quantity: updates.monthlyRequired
      })
    });

    const data = await this.handleResponse(response);
    return data.data.component;
  }

  async deleteComponent(id) {
    const response = await fetch(`${API_BASE_URL}/components/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    await this.handleResponse(response);
    return true;
  }

  // PCBs
  async getPCBs() {
    const response = await fetch(`${API_BASE_URL}/pcbs`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.pcbs || [];
  }

  async addPCB(pcb) {
    const response = await fetch(`${API_BASE_URL}/pcbs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        pcb_name: pcb.name
      })
    });

    const data = await this.handleResponse(response);
    return data.data.pcb;
  }

  async deletePCB(id) {
    const response = await fetch(`${API_BASE_URL}/pcbs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    await this.handleResponse(response);
    return true;
  }

  // BOMs
  async getBOMs() {
    const pcbs = await this.getPCBs();
    const allBOMs = [];

    for (const pcb of pcbs) {
      const response = await fetch(`${API_BASE_URL}/pcbs/${pcb.id}/components`, {
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);
      const components = data.data.components || [];

      components.forEach(comp => {
        allBOMs.push({
          id: comp.mapping_id,
          pcbId: pcb.id,
          componentId: comp.component_id,
          quantity: comp.quantity_per_pcb
        });
      });
    }

    return allBOMs;
  }

  async addBOM(bom) {
    const response = await fetch(`${API_BASE_URL}/pcbs/${bom.pcbId}/components`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        component_id: bom.componentId,
        quantity_per_pcb: bom.quantity
      })
    });

    const data = await this.handleResponse(response);
    return {
      id: data.data.mapping.id,
      pcbId: bom.pcbId,
      componentId: bom.componentId,
      quantity: bom.quantity
    };
  }

  async deleteBOM(id, pcbId, componentId) {
    const response = await fetch(`${API_BASE_URL}/pcbs/${pcbId}/components/${componentId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    await this.handleResponse(response);
    return true;
  }

  // Productions
  async getProductions() {
    const response = await fetch(`${API_BASE_URL}/production`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return (data.data.productionLogs || []).map(log => ({
      id: log.id,
      pcbId: log.pcb_id,
      pcbName: log.pcb_name,
      quantity: log.quantity_produced,
      timestamp: log.produced_at
    }));
  }

  async addProduction(production) {
    const response = await fetch(`${API_BASE_URL}/production`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        pcb_id: production.pcbId,
        quantity_produced: production.quantity
      })
    });

    const data = await this.handleResponse(response);
    return {
      id: data.data.productionLog.id,
      pcbId: data.data.productionLog.pcb_id,
      pcbName: data.data.pcb_name,
      quantity: data.data.productionLog.quantity_produced,
      timestamp: data.data.productionLog.produced_at
    };
  }

  // Procurements
  async getProcurements() {
    const response = await fetch(`${API_BASE_URL}/analytics/procurement-alerts?status=open`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return (data.data.procurementAlerts || []).map(alert => ({
      id: alert.id,
      componentId: alert.component_id,
      componentName: alert.component_name,
      currentStock: alert.current_stock,
      threshold: alert.monthly_required_quantity * 0.2,
      triggerDate: alert.trigger_date,
      status: alert.status,
      notes: ''
    }));
  }

  async updateProcurement(id, updates) {
    if (updates.status === 'resolved') {
      const response = await fetch(`${API_BASE_URL}/analytics/procurement-alerts/${id}/resolve`, {
        method: 'PUT',
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);
      return data.data.procurementAlert;
    }
    return null;
  }

  // Analytics
  async getConsumptionSummary(startDate, endDate) {
    let url = `${API_BASE_URL}/analytics/consumption-summary`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.consumptionSummary || [];
  }

  async getTopConsumed(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/analytics/top-consumed?limit=${limit}`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.topComponents || [];
  }

  async getLowStock() {
    const response = await fetch(`${API_BASE_URL}/analytics/low-stock`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.lowStockComponents || [];
  }

  async getProductionStats(startDate, endDate) {
    let url = `${API_BASE_URL}/analytics/production-stats`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.productionStats || [];
  }

  // Excel Import
  async getImportFiles() {
    const response = await fetch(`${API_BASE_URL}/import/files`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);
    return data.data.files || [];
  }

  async previewExcelFile(filename) {
    const response = await fetch(`${API_BASE_URL}/import/preview/${encodeURIComponent(filename)}`, {
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  async importExcelData(filename, sheetName, importType = 'auto') {
    const response = await fetch(`${API_BASE_URL}/import/excel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ filename, sheetName, importType })
    });

    return this.handleResponse(response);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const api = new RealAPI();
