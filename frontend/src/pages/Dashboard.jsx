import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Cpu, Factory, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import StatusBadge, { getStockStatus, getStockPercentage } from '../components/StatusBadge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState([]);
  const [pcbs, setPcbs] = useState([]);
  const [productions, setProductions] = useState([]);
  const [procurements, setProcurements] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [comps, pcbData, prods, procs] = await Promise.all([
        api.getComponents(),
        api.getPCBs(),
        api.getProductions(),
        api.getProcurements()
      ]);
      setComponents(comps);
      setPcbs(pcbData);
      setProductions(prods);
      setProcurements(procs);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const lowStockComponents = components.filter(c => {
    const status = getStockStatus(c.currentStock, c.monthlyRequired);
    return status === 'warning' || status === 'critical';
  });

  const openAlerts = procurements.filter(p => p.status === 'open').length;

  // Top consumed components (mock data - in production would come from production history)
  const topConsumedData = components
    .sort((a, b) => b.monthlyRequired - a.monthlyRequired)
    .slice(0, 5)
    .map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      consumed: c.monthlyRequired,
    }));

  // Monthly consumption trend (mock data)
  const monthlyTrendData = [
    { month: 'Aug', consumption: 12400 },
    { month: 'Sep', consumption: 15800 },
    { month: 'Oct', consumption: 14200 },
    { month: 'Nov', consumption: 18900 },
    { month: 'Dec', consumption: 16500 },
    { month: 'Jan', consumption: 21200 },
  ];

  // Stock health distribution
  const healthyCount = components.filter(c => getStockStatus(c.currentStock, c.monthlyRequired) === 'healthy').length;
  const warningCount = components.filter(c => getStockStatus(c.currentStock, c.monthlyRequired) === 'warning').length;
  const criticalCount = components.filter(c => getStockStatus(c.currentStock, c.monthlyRequired) === 'critical').length;

  const stockHealthData = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Warning', value: warningCount, color: '#f59e0b' },
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
  ];

  // Recent production activity
  const recentProductions = productions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

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

  const lowStockColumns = [
    {
      header: 'Component',
      accessor: 'name'
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      render: (row) => <span className="mono">{row.currentStock.toLocaleString()}</span>
    },
    {
      header: 'Required',
      accessor: 'monthlyRequired',
      render: (row) => <span className="mono">{row.monthlyRequired.toLocaleString()}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={getStockStatus(row.currentStock, row.monthlyRequired)}
          label={`${getStockPercentage(row.currentStock, row.monthlyRequired)}%`}
        />
      )
    }
  ];

  return (
    <Layout title="Control Center">
      <div className="dashboard">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-primary">
              <Package size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Components</div>
              <div className="kpi-value">{loading ? '—' : components.length}</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-warning">
              <AlertTriangle size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Low Stock Components</div>
              <div className="kpi-value">{loading ? '—' : lowStockComponents.length}</div>
              {!loading && lowStockComponents.length > 0 && (
                <div className="kpi-trend kpi-trend-down">
                  <TrendingDown size={16} />
                  Needs attention
                </div>
              )}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-success">
              <Cpu size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total PCBs</div>
              <div className="kpi-value">{loading ? '—' : pcbs.length}</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-info">
              <Factory size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Production Entries</div>
              <div className="kpi-value">{loading ? '—' : productions.length}</div>
              {!loading && productions.length > 0 && (
                <div className="kpi-trend kpi-trend-up">
                  <TrendingUp size={16} />
                  Active production
                </div>
              )}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-danger">
              <ShoppingCart size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Open Procurement Alerts</div>
              <div className="kpi-value">{loading ? '—' : openAlerts}</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          <Card title="Top Consumed Components">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topConsumedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="consumed" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Monthly Consumption Trend">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Stock Health Distribution">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stockHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="tables-grid">
          <Card title="Low Stock Components">
            <Table
              columns={lowStockColumns}
              data={lowStockComponents.slice(0, 5)}
              loading={loading}
            />
          </Card>

          <Card title="Recent Production Activity">
            <Table
              columns={productionColumns}
              data={recentProductions}
              loading={loading}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
