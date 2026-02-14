import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Activity } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import './Analytics.css';

const Analytics = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const compData = await api.getComponents();
      setComponents(compData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Component ranking by monthly consumption
  const componentRanking = components
    .sort((a, b) => b.monthlyRequired - a.monthlyRequired)
    .slice(0, 10)
    .map(c => ({
      name: c.name.length > 25 ? c.name.substring(0, 25) + '...' : c.name,
      consumption: c.monthlyRequired
    }));

  // ABC Classification (mock data)
  const abcData = [
    { category: 'A-Items (High Value)', count: Math.floor(components.length * 0.2), value: 80 },
    { category: 'B-Items (Medium Value)', count: Math.floor(components.length * 0.3), value: 15 },
    { category: 'C-Items (Low Value)', count: Math.floor(components.length * 0.5), value: 5 },
  ];

  // Monthly trend (mock historical data)
  const monthlyTrend = [
    { month: 'Jul', consumption: 11200, forecast: 11500 },
    { month: 'Aug', consumption: 12400, forecast: 12800 },
    { month: 'Sep', consumption: 15800, forecast: 14500 },
    { month: 'Oct', consumption: 14200, forecast: 15200 },
    { month: 'Nov', consumption: 18900, forecast: 17800 },
    { month: 'Dec', consumption: 16500, forecast: 18500 },
    { month: 'Jan', consumption: 21200, forecast: 20500 },
    { month: 'Feb', consumption: null, forecast: 22800 },
  ];

  // Slow-moving components
  const slowMoving = components
    .filter(c => c.monthlyRequired < 100)
    .slice(0, 5);

  return (
    <Layout title="Consumption Analytics">
      <div className="analytics-grid">
        <Card title="Component Consumption Ranking">
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={componentRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  stroke="#cbd5e1"
                  width={150}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="consumption" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Monthly Consumption Trend & Forecast">
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrend}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  name="Actual"
                  dot={{ fill: '#0ea5e9', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="ABC Classification Analysis">
          <div className="abc-grid">
            {abcData.map((item, idx) => (
              <div key={idx} className="abc-item">
                <div className="abc-header">
                  <div className="abc-category">{item.category}</div>
                  <div className="abc-count mono">{item.count} items</div>
                </div>
                <div className="abc-bar">
                  <div 
                    className="abc-bar-fill" 
                    style={{ width: `${item.value}%` }}
                  >
                    <span className="abc-value">{item.value}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="abc-description">
            ABC analysis helps prioritize inventory management by classifying components based on their consumption value.
          </p>
        </Card>

        <Card title="Slow-Moving Components">
          <div className="slow-moving-list">
            {slowMoving.length === 0 ? (
              <p className="empty-state">No slow-moving components detected</p>
            ) : (
              slowMoving.map(comp => (
                <div key={comp.id} className="slow-moving-item">
                  <div className="slow-moving-info">
                    <div className="slow-moving-name">{comp.name}</div>
                    <div className="slow-moving-part">{comp.partNumber}</div>
                  </div>
                  <div className="slow-moving-stats">
                    <div className="stat">
                      <Package size={16} />
                      <span className="mono">{comp.currentStock}</span>
                      <span className="stat-label">in stock</span>
                    </div>
                    <div className="stat">
                      <Activity size={16} />
                      <span className="mono">{comp.monthlyRequired}</span>
                      <span className="stat-label">monthly</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Inventory Turnover Insights">
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon insight-icon-primary">
                <TrendingUp size={24} />
              </div>
              <div className="insight-content">
                <div className="insight-value">24.5 days</div>
                <div className="insight-label">Avg. Inventory Cycle</div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon insight-icon-success">
                <Package size={24} />
              </div>
              <div className="insight-content">
                <div className="insight-value">87%</div>
                <div className="insight-label">Stock Accuracy</div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon insight-icon-warning">
                <Activity size={24} />
              </div>
              <div className="insight-content">
                <div className="insight-value">14.8x</div>
                <div className="insight-label">Annual Turnover</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;
