import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { toast } from '../components/Toast';
import { api } from '../services/api';
import { format } from 'date-fns';
import './Procurement.css';

const Procurement = () => {
  const [procurements, setProcurements] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [procData, compData] = await Promise.all([
        api.getProcurements(),
        api.getComponents()
      ]);
      setProcurements(procData);
      setComponents(compData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (alert) => {
    setSelectedAlert(alert);
    setNotes(alert.notes || '');
    setShowResolveModal(true);
  };

  const submitResolve = async () => {
    try {
      await api.updateProcurement(selectedAlert.id, {
        status: 'resolved',
        notes,
        resolvedDate: new Date().toISOString()
      });
      toast.success('Alert marked as resolved');
      setShowResolveModal(false);
      loadData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const filteredProcurements = procurements.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const columns = [
    {
      header: 'Component',
      accessor: 'component',
      render: (row) => {
        const component = components.find(c => c.id === row.componentId);
        return (
          <div>
            <div className="component-name">{component?.name || 'Unknown'}</div>
            <div className="component-part-number">{component?.partNumber}</div>
          </div>
        );
      }
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      render: (row) => <span className="mono text-critical">{row.currentStock.toLocaleString()}</span>
    },
    {
      header: 'Threshold',
      accessor: 'threshold',
      render: (row) => <span className="mono">{Math.round(row.threshold).toLocaleString()}</span>
    },
    {
      header: 'Trigger Date',
      accessor: 'triggerDate',
      render: (row) => format(new Date(row.triggerDate), 'MMM dd, yyyy')
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status === 'open' ? 'critical' : 'healthy'}
          label={row.status === 'open' ? 'Open' : 'Resolved'}
        />
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => row.status === 'open' ? (
        <Button 
          variant="ghost" 
          size="sm"
          icon={<CheckCircle size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handleResolve(row);
          }}
        >
          Resolve
        </Button>
      ) : (
        <span className="resolved-text">Resolved</span>
      )
    }
  ];

  const openCount = procurements.filter(p => p.status === 'open').length;
  const resolvedCount = procurements.filter(p => p.status === 'resolved').length;

  return (
    <Layout title="Procurement Alerts">
      <div className="procurement-stats">
        <div className="procurement-stat">
          <ShoppingCart size={20} />
          <div>
            <div className="stat-value">{openCount}</div>
            <div className="stat-label">Open Alerts</div>
          </div>
        </div>
        <div className="procurement-stat">
          <CheckCircle size={20} />
          <div>
            <div className="stat-value">{resolvedCount}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <Card>
        <div className="procurement-filters">
          <div className="filter-group">
            <label>Filter:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Alerts</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <Table columns={columns} data={filteredProcurements} loading={loading} />
      </Card>

      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Procurement Alert"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitResolve}>Mark as Resolved</Button>
          </>
        }
      >
        <div className="resolve-form">
          <p>
            Are you sure you want to mark this alert as resolved?
          </p>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Procurement Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              rows="4"
              placeholder="Add notes about the procurement action taken..."
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Procurement;
