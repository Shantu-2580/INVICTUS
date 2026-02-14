import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, label }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'healthy':
        return { className: 'status-healthy', text: label || 'Healthy' };
      case 'warning':
        return { className: 'status-warning', text: label || 'Warning' };
      case 'critical':
        return { className: 'status-critical', text: label || 'Critical' };
      default:
        return { className: 'status-unknown', text: label || 'Unknown' };
    }
  };

  const { className, text } = getStatusInfo();

  return (
    <span className={`status-badge ${className}`}>
      <span className="status-indicator"></span>
      {text}
    </span>
  );
};

export const getStockStatus = (currentStock, monthlyRequired) => {
  if (!monthlyRequired || monthlyRequired === 0) {
    return 'healthy'; // No requirement means always healthy
  }
  const percentage = (currentStock / monthlyRequired) * 100;
  if (percentage >= 50) return 'healthy';
  if (percentage >= 30) return 'warning';
  return 'critical';
};

export const getStockPercentage = (currentStock, monthlyRequired) => {
  if (!monthlyRequired || monthlyRequired === 0) {
    return 100; // No requirement = 100% stock
  }
  const percentage = (currentStock / monthlyRequired) * 100;
  return isNaN(percentage) ? 0 : Math.round(percentage);
};

export default StatusBadge;
