const API_BASE_URL = 'http://localhost:5000/api';

class RealAPI {

  // ===============================
  // Headers
  // ===============================

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');

    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // ===============================
  // Response Handler
  // ===============================

  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Authentication required.');
      }

      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // ===============================
  // Authentication
  // ===============================

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password })
    });

    const data = await this.handleResponse(response);

    if (data.success && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ===============================
  // Components
  // ===============================

  async getComponents() {
    const response = await fetch(`${API_BASE_URL}/components`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);

    return (data.data.components || []).map(comp => ({
      id: comp.id,
      name: comp.name,
      partNumber: comp.part_number,
      currentStock: comp.current_stock || 0,
      monthlyRequired: comp.monthly_required_quantity || 0
    }));
  }

  // ===============================
  // PCBs
  // ===============================

  async getPCBs() {
    const response = await fetch(`${API_BASE_URL}/pcbs`, {
      headers: this.getHeaders()
    });

    const data = await this.handleResponse(response);

    return (data.data.pcbs || []).map(pcb => ({
      id: pcb.id,
      name: pcb.pcb_name,
      revision: pcb.revision,
      description: pcb.description
    }));
  }

  /**
   * Add new PCB
   * POST /api/pcbs
   */
  async addPCB(pcbData) {
    const response = await fetch(`${API_BASE_URL}/pcbs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        pcb_name: pcbData.name,
        revision: pcbData.revision,
        description: pcbData.description
      })
    });

    const data = await this.handleResponse(response);

    // Map response back to frontend format
    return {
      ...data,
      data: {
        pcb: {
          id: data.data.pcb.id,
          name: data.data.pcb.pcb_name,
          revision: data.data.pcb.revision,
          description: data.data.pcb.description
        }
      }
    };
  }

  /**
   * Get all BOMs (Bill of Materials for all PCBs)
   * Fetches BOM entries by getting components for each PCB
   */
  async getBOMs() {
    const pcbs = await this.getPCBs();
    const allBOMs = [];

    for (const pcb of pcbs) {
      const response = await fetch(
        `${API_BASE_URL}/pcbs/${pcb.id}/components`,
        { headers: this.getHeaders() }
      );
      const data = await this.handleResponse(response);

      // Map to frontend BOM format
      const pcbBOMs = (data.data.components || []).map(comp => ({
        id: comp.mapping_id,
        pcbId: pcb.id,
        componentId: comp.component_id,
        quantity: comp.quantity_per_pcb
      }));

      allBOMs.push(...pcbBOMs);
    }

    return allBOMs;
  }

  /**
   * Add component to PCB BOM
   * POST /api/pcbs/:pcbId/components
   */
  async addBOM(bomData) {
    const response = await fetch(
      `${API_BASE_URL}/pcbs/${bomData.pcbId}/components`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          component_id: bomData.componentId,
          quantity_per_pcb: bomData.quantity
        })
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Delete component from PCB BOM
   * DELETE /api/pcbs/:pcbId/components/:componentId
   * Note: We need to fetch the BOM first to get pcbId and componentId
   */
  async deleteBOM(bomId) {
    // Get all BOMs to find the one we want to delete
    const boms = await this.getBOMs();
    const bom = boms.find(b => b.id === bomId);

    if (!bom) {
      throw new Error('BOM entry not found');
    }

    const response = await fetch(
      `${API_BASE_URL}/pcbs/${bom.pcbId}/components/${bom.componentId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders()
      }
    );

    return this.handleResponse(response);
  }

  // ===============================
  // Productions
  // ===============================

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

  // ===============================
  // Procurements
  // ===============================

  async getProcurements() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/procurement-alerts?status=open`,
      { headers: this.getHeaders() }
    );

    const data = await this.handleResponse(response);

    return data.data.procurementAlerts || [];
  }

  // ===============================
  // 🔥 Excel Import Section
  // ===============================

  async getImportFiles() {
    const response = await fetch(`${API_BASE_URL}/import/files`, {
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  async previewExcelFile(filename) {
    const response = await fetch(
      `${API_BASE_URL}/import/preview/${encodeURIComponent(filename)}`,
      {
        headers: this.getHeaders()
      }
    );

    return this.handleResponse(response);
  }

  async importExcelData(filename, sheetName, importType = 'auto') {
    const response = await fetch(`${API_BASE_URL}/import/excel`, {
      method: 'POST', // ✅ MUST be POST
      headers: this.getHeaders(),
      body: JSON.stringify({
        filename,
        sheetName,
        importType
      })
    });

    return this.handleResponse(response);
  }

  // ===============================
  // Helpers
  // ===============================

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const api = new RealAPI();
