import React, { useState, useEffect } from 'react';
import { Plus, Cpu, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { api } from '../services/api';
import './PCBs.css';

const PCBs = () => {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPCBModal, setShowAddPCBModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedPCB, setSelectedPCB] = useState(null);
  const [pcbFormData, setPcbFormData] = useState({
    name: '',
    revision: '',
    description: ''
  });
  const [bomFormData, setBomFormData] = useState({
    componentId: '',
    quantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pcbData, compData, bomData] = await Promise.all([
        api.getPCBs(),
        api.getComponents(),
        api.getBOMs()
      ]);
      setPcbs(pcbData);
      setComponents(compData);
      setBoms(bomData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPCB = async () => {
    if (!pcbFormData.name) {
      toast.error('Please enter PCB name');
      return;
    }

    try {
      await api.addPCB(pcbFormData);
      toast.success('PCB added successfully');
      setShowAddPCBModal(false);
      setPcbFormData({ name: '', revision: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error adding PCB:', error);
      toast.error('Failed to add PCB');
    }
  };

  const handleManageBOM = (pcb) => {
    setSelectedPCB(pcb);
    setShowBOMModal(true);
    setBomFormData({ componentId: '', quantity: 1 });
  };

  const handleAddToBOM = async () => {
    if (!bomFormData.componentId) {
      toast.error('Please select a component');
      return;
    }

    // Check for duplicate
    const exists = boms.find(
      b => b.pcbId === selectedPCB.id && b.componentId === parseInt(bomFormData.componentId)
    );

    if (exists) {
      toast.error('Component already added to this PCB');
      return;
    }

    try {
      await api.addBOM({
        pcbId: selectedPCB.id,
        componentId: parseInt(bomFormData.componentId),
        quantity: bomFormData.quantity
      });
      toast.success('Component added to BOM');
      setBomFormData({ componentId: '', quantity: 1 });
      loadData();
    } catch (error) {
      console.error('Error adding to BOM:', error);
      toast.error('Failed to add component');
    }
  };

  const handleRemoveFromBOM = async (bomId) => {
    try {
      await api.deleteBOM(bomId);
      toast.success('Component removed from BOM');
      loadData();
    } catch (error) {
      console.error('Error removing from BOM:', error);
      toast.error('Failed to remove component');
    }
  };

  const getPCBBOM = (pcbId) => {
    return boms
      .filter(b => b.pcbId === pcbId)
      .map(b => {
        const component = components.find(c => c.id === b.componentId);
        return { ...b, component };
      });
  };

  return (
    <Layout 
      title="PCB & BOM Management"
      actions={
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowAddPCBModal(true)}>
          Add PCB
        </Button>
      }
    >
      <div className="pcb-grid">
        {loading ? (
          <div>Loading...</div>
        ) : pcbs.length === 0 ? (
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-steel-500)' }}>
              No PCBs defined. Click "Add PCB" to create your first PCB.
            </div>
          </Card>
        ) : (
          pcbs.map(pcb => {
            const pcbBOM = getPCBBOM(pcb.id);
            return (
              <Card key={pcb.id}>
                <div className="pcb-card">
                  <div className="pcb-header">
                    <div className="pcb-icon">
                      <Cpu size={24} />
                    </div>
                    <div className="pcb-info">
                      <h3 className="pcb-name">{pcb.name}</h3>
                      <div className="pcb-meta">
                        <span className="pcb-revision">{pcb.revision}</span>
                        <span className="pcb-separator">•</span>
                        <span className="pcb-components">{pcbBOM.length} components</span>
                      </div>
                      {pcb.description && (
                        <p className="pcb-description">{pcb.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="bom-section">
                    <div className="bom-header">
                      <h4>Bill of Materials</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={<Plus size={16} />}
                        onClick={() => handleManageBOM(pcb)}
                      >
                        Add Component
                      </Button>
                    </div>

                    {pcbBOM.length === 0 ? (
                      <div className="bom-empty">No components added yet</div>
                    ) : (
                      <div className="bom-list">
                        {pcbBOM.map(item => (
                          <div key={item.id} className="bom-item">
                            <div className="bom-item-info">
                              <div className="bom-item-name">{item.component?.name || 'Unknown'}</div>
                              <div className="bom-item-part">{item.component?.partNumber}</div>
                            </div>
                            <div className="bom-item-quantity mono">
                              {item.quantity} × {item.component?.currentStock || 0} available
                            </div>
                            <button
                              className="bom-remove-btn"
                              onClick={() => handleRemoveFromBOM(item.id)}
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add PCB Modal */}
      <Modal
        isOpen={showAddPCBModal}
        onClose={() => setShowAddPCBModal(false)}
        title="Add New PCB"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddPCBModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddPCB}>Add PCB</Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>PCB Name *</label>
            <input
              type="text"
              value={pcbFormData.name}
              onChange={(e) => setPcbFormData({...pcbFormData, name: e.target.value})}
              className="form-input"
              placeholder="e.g., Arduino UNO Clone"
            />
          </div>

          <div className="form-group">
            <label>Revision</label>
            <input
              type="text"
              value={pcbFormData.revision}
              onChange={(e) => setPcbFormData({...pcbFormData, revision: e.target.value})}
              className="form-input"
              placeholder="e.g., v3.1"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea
              value={pcbFormData.description}
              onChange={(e) => setPcbFormData({...pcbFormData, description: e.target.value})}
              className="form-input"
              rows="3"
              placeholder="Brief description of the PCB"
            />
          </div>
        </div>
      </Modal>

      {/* Manage BOM Modal */}
      <Modal
        isOpen={showBOMModal}
        onClose={() => setShowBOMModal(false)}
        title={`Manage BOM - ${selectedPCB?.name}`}
        size="md"
      >
        <div className="bom-modal-content">
          <div className="form-group">
            <label>Select Component</label>
            <select
              value={bomFormData.componentId}
              onChange={(e) => setBomFormData({...bomFormData, componentId: e.target.value})}
              className="form-input"
            >
              <option value="">Choose a component...</option>
              {components.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.partNumber}) - Stock: {c.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity per PCB</label>
            <input
              type="number"
              value={bomFormData.quantity}
              onChange={(e) => setBomFormData({...bomFormData, quantity: parseInt(e.target.value) || 1})}
              className="form-input"
              min="1"
            />
          </div>

          <Button variant="primary" onClick={handleAddToBOM} style={{ width: '100%', marginTop: '1rem' }}>
            Add to BOM
          </Button>

          <div className="bom-preview">
            <h4>Current BOM</h4>
            {selectedPCB && getPCBBOM(selectedPCB.id).length === 0 ? (
              <p className="bom-empty">No components added yet</p>
            ) : (
              <div className="bom-list">
                {selectedPCB && getPCBBOM(selectedPCB.id).map(item => (
                  <div key={item.id} className="bom-item">
                    <div className="bom-item-info">
                      <div className="bom-item-name">{item.component?.name}</div>
                      <div className="bom-item-part">{item.component?.partNumber}</div>
                    </div>
                    <div className="bom-item-quantity mono">Qty: {item.quantity}</div>
                    <button
                      className="bom-remove-btn"
                      onClick={() => handleRemoveFromBOM(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default PCBs;
