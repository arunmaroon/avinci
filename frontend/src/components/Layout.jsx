import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={onLogout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
