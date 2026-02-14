import React, { useState, useEffect } from 'react';
import { Factory, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { api } from '../services/api';
import { format } from 'date-fns';
import './Production.css';

const Production = () => {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [boms, setBoms] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pcbId: '',
    quantity: 1
  });
  const [deductionPreview, setDeductionPreview] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pcbData, compData, bomData, prodData] = await Promise.all([
        api.getPCBs(),
        api.getComponents(),
        api.getBOMs(),
        api.getProductions()
      ]);
      setPcbs(pcbData);
      setComponents(compData);
      setBoms(bomData);
      setProductions(prodData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.pcbId && formData.quantity > 0) {
      calculateDeduction();
    } else {
      setDeductionPreview([]);
    }
  }, [formData.pcbId, formData.quantity]);

  const calculateDeduction = () => {
    const pcbBoms = boms.filter(b => b.pcbId === parseInt(formData.pcbId));
    const preview = pcbBoms.map(bom => {
      const component = components.find(c => c.id === bom.componentId);
      const required = bom.quantity * formData.quantity;
      const afterDeduction = component.currentStock - required;
      const insufficient = afterDeduction < 0;

      return {
        component: component?.name || 'Unknown',
        currentStock: component?.currentStock || 0,
        required,
        afterDeduction,
        insufficient
      };
    });
    setDeductionPreview(preview);
  };

  const handleSubmit = async () => {
    if (!formData.pcbId) {
      toast.error('Please select a PCB');
      return;
    }

    // Check for insufficient stock
    const hasInsufficient = deductionPreview.some(d => d.insufficient);
    if (hasInsufficient) {
      toast.error('Insufficient stock for some components');
      return;
    }

    try {
      await api.addProduction(formData);
      toast.success('Production entry recorded successfully');
      setShowModal(false);
      setFormData({ pcbId: '', quantity: 1 });
      loadData();
    } catch (error) {
      console.error('Error recording production:', error);
      toast.error('Failed to record production');
    }
  };

  const productionColumns = [
    {
      header: 'PCB',
      accessor: 'pcbName',
      render: (row) => {
        const pcb = pcbs.find(p => p.id === row.pcbId);
        return pcb?.name || 'Unknown';
      }
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => <span className="mono">{row.quantity} units</span>
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => format(new Date(row.timestamp), 'MMM dd, yyyy HH:mm')
    }
  ];

  return (
    <Layout 
      title="Production Management"
      actions={
        <Button variant="primary" icon={<Factory size={18} />} onClick={() => setShowModal(true)}>
          Record Production
        </Button>
      }
    >
      <Card title="Production History">
        <Table columns={productionColumns} data={productions} loading={loading} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Production"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>Record Production</Button>
          </>
        }
      >
        <div className="production-form">
          <div className="form-group">
            <label>Select PCB</label>
            <select
              value={formData.pcbId}
              onChange={(e) => setFormData({...formData, pcbId: e.target.value})}
              className="form-input"
            >
              <option value="">Choose a PCB...</option>
              {pcbs.map(pcb => (
                <option key={pcb.id} value={pcb.id}>
                  {pcb.name} ({pcb.revision})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Production Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              className="form-input"
              min="1"
            />
          </div>

          {deductionPreview.length > 0 && (
            <div className="deduction-preview">
              <h4>Stock Deduction Preview</h4>
              <div className="deduction-table">
                <div className="deduction-header">
                  <div>Component</div>
                  <div>Current</div>
                  <div>Required</div>
                  <div>After</div>
                </div>
                {deductionPreview.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`deduction-row ${item.insufficient ? 'deduction-row-error' : ''}`}
                  >
                    <div className="deduction-component">
                      {item.component}
                      {item.insufficient && (
                        <span className="insufficient-badge">
                          <AlertCircle size={14} /> Insufficient
                        </span>
                      )}
                    </div>
                    <div className="mono">{item.currentStock.toLocaleString()}</div>
                    <div className="mono">{item.required.toLocaleString()}</div>
                    <div className={`mono ${item.insufficient ? 'text-critical' : ''}`}>
                      {item.afterDeduction.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Production;
