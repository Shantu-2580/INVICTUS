import React from 'react';
import './SkeletonLoader.css';

/**
 * Reusable skeleton loader component for better loading states
 * @param {Object} props
 * @param {string} props.variant - Type of skeleton: 'text', 'card', 'table', 'chart', 'kpi'
 * @param {number} props.count - Number of skeleton items to render
 * @param {string} props.className - Additional CSS classes
 */
const SkeletonLoader = ({ variant = 'text', count = 1, className = '' }) => {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    const renderSkeleton = (index) => {
        switch (variant) {
            case 'text':
                return (
                    <div key={index} className={`skeleton-text ${className}`}>
                        <div className="skeleton-line"></div>
                    </div>
                );

            case 'kpi':
                return (
                    <div key={index} className={`skeleton-kpi ${className}`}>
                        <div className="skeleton-kpi-icon skeleton"></div>
                        <div className="skeleton-kpi-content">
                            <div className="skeleton-line skeleton-line-sm"></div>
                            <div className="skeleton-line skeleton-line-lg"></div>
                        </div>
                    </div>
                );

            case 'card':
                return (
                    <div key={index} className={`skeleton-card ${className}`}>
                        <div className="skeleton-card-header">
                            <div className="skeleton-line skeleton-line-lg"></div>
                            <div className="skeleton-line skeleton-line-sm"></div>
                        </div>
                        <div className="skeleton-card-body">
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line skeleton-line-md"></div>
                        </div>
                    </div>
                );

            case 'table':
                return (
                    <div key={index} className={`skeleton-table ${className}`}>
                        <div className="skeleton-table-header">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="skeleton-line skeleton-line-sm"></div>
                            ))}
                        </div>
                        <div className="skeleton-table-body">
                            {Array.from({ length: 5 }, (_, rowIndex) => (
                                <div key={rowIndex} className="skeleton-table-row">
                                    {Array.from({ length: 6 }, (_, colIndex) => (
                                        <div key={colIndex} className="skeleton-line"></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'chart':
                return (
                    <div key={index} className={`skeleton-chart ${className}`}>
                        <div className="skeleton-chart-bars">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div
                                    key={i}
                                    className="skeleton-chart-bar skeleton"
                                    style={{ height: `${Math.random() * 60 + 40}%` }}
                                ></div>
                            ))}
                        </div>
                        <div className="skeleton-chart-legend">
                            <div className="skeleton-line skeleton-line-sm"></div>
                            <div className="skeleton-line skeleton-line-sm"></div>
                        </div>
                    </div>
                );

            default:
                return <div key={index} className={`skeleton ${className}`}></div>;
        }
    };

    return <>{skeletons.map((_, index) => renderSkeleton(index))}</>;
};

export default SkeletonLoader;
