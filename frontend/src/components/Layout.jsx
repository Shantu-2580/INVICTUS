import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, title, actions }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {(title || actions) && (
          <div className="page-header">
            {title && <h1 className="page-title">{title}</h1>}
            {actions && <div className="page-actions">{actions}</div>}
          </div>
        )}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
