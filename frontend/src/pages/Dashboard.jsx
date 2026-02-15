import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Cpu,
  Factory,
  ShoppingCart,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import StatusBadge, {
  getStockStatus,
  getStockPercentage
} from '../components/StatusBadge';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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

      setComponents(comps || []);
      setPcbs(pcbData || []);
      setProductions(prods || []);
      setProcurements(procs || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAFE DERIVED DATA ================= */

  const lowStockComponents = useMemo(() => {
    return components.filter(c => {
      const stock = Number(c.currentStock ?? 0);
      const required = Number(c.monthlyRequired ?? 0);
      const status = getStockStatus(stock, required);
      return status === 'warning' || status === 'critical';
    });
  }, [components]);

  const openAlerts = useMemo(() => {
    return procurements.filter(p => p.status === 'open').length;
  }, [procurements]);

  const topConsumedData = useMemo(() => {
    return [...components]
      .sort((a, b) =>
        Number(b.monthlyRequired ?? 0) -
        Number(a.monthlyRequired ?? 0)
      )
      .slice(0, 5)
      .map(c => ({
        name:
          c.name && c.name.length > 20
            ? c.name.substring(0, 20) + '...'
            : c.name || '—',
        consumed: Number(c.monthlyRequired ?? 0)
      }));
  }, [components]);

  const stockHealthData = useMemo(() => {
    let healthy = 0;
    let warning = 0;
    let critical = 0;

    components.forEach(c => {
      const stock = Number(c.currentStock ?? 0);
      const required = Number(c.monthlyRequired ?? 0);
      const status = getStockStatus(stock, required);

      if (status === 'healthy') healthy++;
      if (status === 'warning') warning++;
      if (status === 'critical') critical++;
    });

    return [
      { name: 'Healthy', value: healthy, color: '#10b981' },
      { name: 'Warning', value: warning, color: '#f59e0b' },
      { name: 'Critical', value: critical, color: '#ef4444' }
    ];
  }, [components]);

  const recentProductions = useMemo(() => {
    return [...productions]
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0) -
          new Date(a.timestamp || 0)
      )
      .slice(0, 5);
  }, [productions]);

  // Calculate total OK and SCRAP pieces
  const productionStats = useMemo(() => {
    let totalOk = 0;
    let totalScrap = 0;
    let totalProduced = 0;

    productions.forEach(p => {
      totalProduced += Number(p.quantity || 0);
      totalOk += Number(p.quantityOk || 0);
      totalScrap += Number(p.quantityScrap || 0);
    });

    const successRate = totalProduced > 0
      ? ((totalOk / totalProduced) * 100).toFixed(1)
      : 0;

    return { totalOk, totalScrap, totalProduced, successRate };
  }, [productions]);

  /* ================= SAFE TABLE CONFIG ================= */

  const productionColumns = [
    {
      header: 'PCB',
      accessor: 'pcbName',
      render: row => row.pcbName || 'Unknown'
    },
    {
      header: 'Total',
      accessor: 'quantity',
      render: row => (
        <span className="mono">
          {Number(row.quantity ?? 0)} units
        </span>
      )
    },
    {
      header: 'OK',
      accessor: 'quantityOk',
      render: row => (
        <span className="mono" style={{ color: '#10b981' }}>
          {row.quantityOk !== null && row.quantityOk !== undefined
            ? Number(row.quantityOk)
            : '—'}
        </span>
      )
    },
    {
      header: 'Faulty',
      accessor: 'quantityScrap',
      render: row => (
        <span className="mono" style={{ color: '#ef4444' }}>
          {row.quantityScrap !== null && row.quantityScrap !== undefined
            ? Number(row.quantityScrap)
            : '—'}
        </span>
      )
    },
    {
      header: 'Success Rate',
      accessor: 'successRate',
      render: row => {
        if (row.quantityOk === null || row.quantityOk === undefined) {
          return <span>—</span>;
        }
        const total = Number(row.quantity || 0);
        const ok = Number(row.quantityOk || 0);
        const rate = total > 0 ? ((ok / total) * 100).toFixed(1) : 0;
        return (
          <span className="mono" style={{
            color: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444'
          }}>
            {rate}%
          </span>
        );
      }
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: row =>
        row.timestamp
          ? format(new Date(row.timestamp), 'MMM dd, yyyy HH:mm')
          : '—'
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
      render: row => (
        <span className="mono">
          {Number(row.currentStock ?? 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Required',
      accessor: 'monthlyRequired',
      render: row => (
        <span className="mono">
          {Number(row.monthlyRequired ?? 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: row => {
        const stock = Number(row.currentStock ?? 0);
        const required = Number(row.monthlyRequired ?? 0);
        return (
          <StatusBadge
            status={getStockStatus(stock, required)}
            label={`${getStockPercentage(stock, required)}%`}
          />
        );
      }
    }
  ];

  /* ================= RENDER ================= */

  return (
    <Layout title="Control Center">
      <div className="dashboard">

        {/* KPI */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <Package size={20} />
            <div>{loading ? '—' : components.length}</div>
            <span>Total Components</span>
          </div>

          <div className="kpi-card">
            <AlertTriangle size={20} />
            <div>{loading ? '—' : lowStockComponents.length}</div>
            <span>Low Stock</span>
          </div>

          <div className="kpi-card">
            <Cpu size={20} />
            <div>{loading ? '—' : pcbs.length}</div>
            <span>Total PCBs</span>
          </div>

          <div className="kpi-card">
            <Factory size={20} />
            <div>{loading ? '—' : productions.length}</div>
            <span>Production Entries</span>
          </div>

          <div className="kpi-card">
            <CheckCircle size={20} />
            <div>{loading ? '—' : productionStats.totalOk.toLocaleString()}</div>
            <span>Healthy Pieces</span>
          </div>

          <div className="kpi-card">
            <XCircle size={20} />
            <div>{loading ? '—' : productionStats.totalScrap.toLocaleString()}</div>
            <span>Faulty Pieces</span>
          </div>

          <div className="kpi-card" style={{ gridColumn: 'span 2' }}>
            <Factory size={20} />
            <div style={{ color: productionStats.successRate >= 80 ? '#10b981' : productionStats.successRate >= 60 ? '#f59e0b' : '#ef4444' }}>
              {loading ? '—' : `${productionStats.successRate}%`}
            </div>
            <span>Overall Success Rate</span>
          </div>

          <div className="kpi-card">
            <ShoppingCart size={20} />
            <div>{loading ? '—' : openAlerts}</div>
            <span>Open Alerts</span>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <Card title="Top Consumed">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topConsumedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumed" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Stock Health">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stockHealthData} dataKey="value">
                  {stockHealthData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tables */}
        <div className="tables-grid">
          <Card title="Low Stock">
            <Table
              columns={lowStockColumns}
              data={lowStockComponents}
              loading={loading}
            />
          </Card>

          <Card title="Recent Production">
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
