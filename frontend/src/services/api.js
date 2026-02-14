// Mock API Service for Demo
// Replace with actual API endpoints in production

class MockAPI {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // Initialize with demo data if not exists
    if (!localStorage.getItem('components')) {
      const components = [
        { id: 1, name: 'ATmega328P', partNumber: 'ATMEGA328P-PU', currentStock: 450, monthlyRequired: 500, category: 'Microcontroller' },
        { id: 2, name: 'ESP32-WROOM-32', partNumber: 'ESP32-WROOM-32D', currentStock: 120, monthlyRequired: 200, category: 'Wireless Module' },
        { id: 3, name: 'Resistor 10K 0805', partNumber: 'RC0805FR-0710KL', currentStock: 8500, monthlyRequired: 5000, category: 'Passive' },
        { id: 4, name: 'Capacitor 100nF 0805', partNumber: 'CL21B104KBCNNNC', currentStock: 7200, monthlyRequired: 6000, category: 'Passive' },
        { id: 5, name: 'LED Red 0805', partNumber: 'LTST-C150KRKT', currentStock: 45, monthlyRequired: 1000, category: 'LED' },
        { id: 6, name: 'LM7805 Voltage Regulator', partNumber: 'LM7805CT', currentStock: 280, monthlyRequired: 300, category: 'Power' },
        { id: 7, name: 'Crystal 16MHz', partNumber: 'ABM8-16.000MHZ-B2-T', currentStock: 190, monthlyRequired: 250, category: 'Timing' },
        { id: 8, name: 'Capacitor 22pF 0805', partNumber: 'GRM2165C1H220JA01D', currentStock: 3800, monthlyRequired: 500, category: 'Passive' },
      ];
      localStorage.setItem('components', JSON.stringify(components));
    }

    if (!localStorage.getItem('pcbs')) {
      const pcbs = [
        { id: 1, name: 'Arduino UNO Clone', revision: 'v3.1', description: 'ATmega328P based development board' },
        { id: 2, name: 'IoT Sensor Node', revision: 'v2.0', description: 'ESP32-based wireless sensor platform' },
        { id: 3, name: 'Power Supply Board', revision: 'v1.5', description: '5V/12V dual output power supply' },
      ];
      localStorage.setItem('pcbs', JSON.stringify(pcbs));
    }

    if (!localStorage.getItem('boms')) {
      const boms = [
        { id: 1, pcbId: 1, componentId: 1, quantity: 1 },
        { id: 2, pcbId: 1, componentId: 3, quantity: 10 },
        { id: 3, pcbId: 1, componentId: 4, quantity: 5 },
        { id: 4, pcbId: 1, componentId: 7, quantity: 1 },
        { id: 5, pcbId: 2, componentId: 2, quantity: 1 },
        { id: 6, pcbId: 2, componentId: 3, quantity: 8 },
        { id: 7, pcbId: 2, componentId: 4, quantity: 6 },
        { id: 8, pcbId: 2, componentId: 5, quantity: 2 },
      ];
      localStorage.setItem('boms', JSON.stringify(boms));
    }

    if (!localStorage.getItem('productions')) {
      const productions = [];
      localStorage.setItem('productions', JSON.stringify(productions));
    }

    if (!localStorage.getItem('procurements')) {
      const procurements = [];
      localStorage.setItem('procurements', JSON.stringify(procurements));
    }
  }

  // Components
  async getComponents() {
    return new Promise(resolve => {
      setTimeout(() => {
        const components = JSON.parse(localStorage.getItem('components') || '[]');
        resolve(components);
      }, 300);
    });
  }

  async addComponent(component) {
    return new Promise(resolve => {
      setTimeout(() => {
        const components = JSON.parse(localStorage.getItem('components') || '[]');
        const newComponent = {
          ...component,
          id: Date.now()
        };
        components.push(newComponent);
        localStorage.setItem('components', JSON.stringify(components));
        resolve(newComponent);
      }, 300);
    });
  }

  async updateComponent(id, updates) {
    return new Promise(resolve => {
      setTimeout(() => {
        const components = JSON.parse(localStorage.getItem('components') || '[]');
        const index = components.findIndex(c => c.id === id);
        if (index !== -1) {
          components[index] = { ...components[index], ...updates };
          localStorage.setItem('components', JSON.stringify(components));
          resolve(components[index]);
        }
        resolve(null);
      }, 300);
    });
  }

  async deleteComponent(id) {
    return new Promise(resolve => {
      setTimeout(() => {
        let components = JSON.parse(localStorage.getItem('components') || '[]');
        components = components.filter(c => c.id !== id);
        localStorage.setItem('components', JSON.stringify(components));
        resolve(true);
      }, 300);
    });
  }

  // PCBs
  async getPCBs() {
    return new Promise(resolve => {
      setTimeout(() => {
        const pcbs = JSON.parse(localStorage.getItem('pcbs') || '[]');
        resolve(pcbs);
      }, 300);
    });
  }

  async addPCB(pcb) {
    return new Promise(resolve => {
      setTimeout(() => {
        const pcbs = JSON.parse(localStorage.getItem('pcbs') || '[]');
        const newPCB = {
          ...pcb,
          id: Date.now()
        };
        pcbs.push(newPCB);
        localStorage.setItem('pcbs', JSON.stringify(pcbs));
        resolve(newPCB);
      }, 300);
    });
  }

  // BOMs
  async getBOMs() {
    return new Promise(resolve => {
      setTimeout(() => {
        const boms = JSON.parse(localStorage.getItem('boms') || '[]');
        resolve(boms);
      }, 300);
    });
  }

  async addBOM(bom) {
    return new Promise(resolve => {
      setTimeout(() => {
        const boms = JSON.parse(localStorage.getItem('boms') || '[]');
        const newBOM = {
          ...bom,
          id: Date.now()
        };
        boms.push(newBOM);
        localStorage.setItem('boms', JSON.stringify(boms));
        resolve(newBOM);
      }, 300);
    });
  }

  async deleteBOM(id) {
    return new Promise(resolve => {
      setTimeout(() => {
        let boms = JSON.parse(localStorage.getItem('boms') || '[]');
        boms = boms.filter(b => b.id !== id);
        localStorage.setItem('boms', JSON.stringify(boms));
        resolve(true);
      }, 300);
    });
  }

  // Productions
  async getProductions() {
    return new Promise(resolve => {
      setTimeout(() => {
        const productions = JSON.parse(localStorage.getItem('productions') || '[]');
        resolve(productions);
      }, 300);
    });
  }

  async addProduction(production) {
    return new Promise(resolve => {
      setTimeout(() => {
        const productions = JSON.parse(localStorage.getItem('productions') || '[]');
        const components = JSON.parse(localStorage.getItem('components') || '[]');
        const boms = JSON.parse(localStorage.getItem('boms') || '[]');

        // Deduct stock
        const pcbBoms = boms.filter(b => b.pcbId === production.pcbId);
        pcbBoms.forEach(bom => {
          const compIndex = components.findIndex(c => c.id === bom.componentId);
          if (compIndex !== -1) {
            components[compIndex].currentStock -= bom.quantity * production.quantity;
          }
        });

        const newProduction = {
          ...production,
          id: Date.now(),
          timestamp: new Date().toISOString()
        };

        productions.push(newProduction);
        localStorage.setItem('productions', JSON.stringify(productions));
        localStorage.setItem('components', JSON.stringify(components));
        
        // Generate procurement alerts for low stock
        this.checkAndGenerateProcurementAlerts(components);
        
        resolve(newProduction);
      }, 300);
    });
  }

  checkAndGenerateProcurementAlerts(components) {
    const procurements = JSON.parse(localStorage.getItem('procurements') || '[]');
    
    components.forEach(component => {
      const stockPercentage = (component.currentStock / component.monthlyRequired) * 100;
      if (stockPercentage < 30) {
        // Check if alert already exists
        const existingAlert = procurements.find(
          p => p.componentId === component.id && p.status === 'open'
        );
        
        if (!existingAlert) {
          procurements.push({
            id: Date.now() + component.id,
            componentId: component.id,
            currentStock: component.currentStock,
            threshold: component.monthlyRequired * 0.3,
            triggerDate: new Date().toISOString(),
            status: 'open',
            notes: ''
          });
        }
      }
    });
    
    localStorage.setItem('procurements', JSON.stringify(procurements));
  }

  // Procurements
  async getProcurements() {
    return new Promise(resolve => {
      setTimeout(() => {
        const procurements = JSON.parse(localStorage.getItem('procurements') || '[]');
        resolve(procurements);
      }, 300);
    });
  }

  async updateProcurement(id, updates) {
    return new Promise(resolve => {
      setTimeout(() => {
        const procurements = JSON.parse(localStorage.getItem('procurements') || '[]');
        const index = procurements.findIndex(p => p.id === id);
        if (index !== -1) {
          procurements[index] = { ...procurements[index], ...updates };
          localStorage.setItem('procurements', JSON.stringify(procurements));
          resolve(procurements[index]);
        }
        resolve(null);
      }, 300);
    });
  }
}

export const api = new MockAPI();
