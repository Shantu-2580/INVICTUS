import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import StatusBadge, { getStockStatus, getStockPercentage } from '../components/StatusBadge';
import { toast } from '../components/Toast';
import { api } from '../services/api';
import './Components.css';

const Components = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    currentStock: 0,
    monthlyRequired: 0,
    category: ''
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const data = await api.getComponents();
      setComponents(data);
    } catch (error) {
      console.error('Error loading components:', error);
      toast.error('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      partNumber: '',
      currentStock: 0,
      monthlyRequired: 0,
      category: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (component) => {
    setSelectedComponent(component);
    setFormData({
      name: component.name,
      partNumber: component.partNumber,
      currentStock: component.currentStock,
      monthlyRequired: component.monthlyRequired,
      category: component.category
    });
    setShowEditModal(true);
  };

  const handleDelete = (component) => {
    setSelectedComponent(component);
    setShowDeleteModal(true);
  };

  const submitAdd = async () => {
    if (!formData.name || !formData.partNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.addComponent(formData);
      toast.success('Component added successfully');
      setShowAddModal(false);
      loadComponents();
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  const submitEdit = async () => {
    if (!formData.name || !formData.partNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.updateComponent(selectedComponent.id, formData);
      toast.success('Component updated successfully');
      setShowEditModal(false);
      loadComponents();
    } catch (error) {
      console.error('Error updating component:', error);
      toast.error('Failed to update component');
    }
  };

  const submitDelete = async () => {
    try {
      await api.deleteComponent(selectedComponent.id);
      toast.success('Component deleted successfully');
      setShowDeleteModal(false);
      loadComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error('Failed to delete component');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Part Number', 'Current Stock', 'Monthly Required', 'Category', 'Stock %', 'Status'].join(','),
      ...filteredComponents.map(c => [
        c.name,
        c.partNumber,
        c.currentStock,
        c.monthlyRequired,
        c.category,
        getStockPercentage(c.currentStock, c.monthlyRequired),
        getStockStatus(c.currentStock, c.monthlyRequired)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `components-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Components exported successfully');
  };

  // Filter and search
  const filteredComponents = components.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStockStatus(c.currentStock, c.monthlyRequired);
    return matchesSearch && status === filterStatus;
  });

  const columns = [
    {
      header: 'Component Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="component-name">{row.name}</div>
          <div className="component-part-number">{row.partNumber}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      render: (row) => <span className="mono">{row.currentStock.toLocaleString()}</span>
    },
    {
      header: 'Monthly Required',
      accessor: 'monthlyRequired',
      render: (row) => <span className="mono">{row.monthlyRequired.toLocaleString()}</span>
    },
    {
      header: 'Stock %',
      accessor: 'stockPercentage',
      render: (row) => {
        const percentage = getStockPercentage(row.currentStock, row.monthlyRequired);
        return <span className="mono">{percentage}%</span>;
      }
    },
    {
      header: 'Health',
      accessor: 'status',
      render: (row) => (
        <StatusBadge status={getStockStatus(row.currentStock, row.monthlyRequired)} />
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="action-buttons">
          <button 
            className="action-btn action-btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="action-btn action-btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout 
      title="Component Management"
      actions={
        <>
          <Button variant="ghost" icon={<Upload size={18} />}>Import</Button>
          <Button variant="ghost" icon={<Download size={18} />} onClick={handleExport}>Export</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>Add Component</Button>
        </>
      }
    >
      <Card>
        <div className="component-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Components</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <Table columns={columns} data={filteredComponents} loading={loading} />
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Component"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitAdd}>Add Component</Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Component Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              placeholder="e.g., ATmega328P"
            />
          </div>

          <div className="form-group">
            <label>Part Number *</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
              className="form-input"
              placeholder="e.g., ATMEGA328P-PU"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-input"
              placeholder="e.g., Microcontroller"
            />
          </div>

          <div className="form-group">
            <label>Current Stock</label>
            <input
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
              className="form-input"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Monthly Required Quantity</label>
            <input
              type="number"
              value={formData.monthlyRequired}
              onChange={(e) => setFormData({...formData, monthlyRequired: parseInt(e.target.value) || 0})}
              className="form-input"
              min="0"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Component"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Component Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Part Number *</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Current Stock</label>
            <input
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
              className="form-input"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Monthly Required Quantity</label>
            <input
              type="number"
              value={formData.monthlyRequired}
              onChange={(e) => setFormData({...formData, monthlyRequired: parseInt(e.target.value) || 0})}
              className="form-input"
              min="0"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={submitDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedComponent?.name}</strong>?</p>
        <p className="text-warning" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          This action cannot be undone.
        </p>
      </Modal>
    </Layout>
  );
};

export default Components;
