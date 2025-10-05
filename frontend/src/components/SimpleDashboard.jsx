import React from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('sirius_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('sirius_user');
    navigate('/');
  };

  const features = [
    {
      title: 'AI Agent Generation',
      description: 'Generate AI agents from user research data',
      icon: '🤖',
      color: 'bg-blue-500'
    },
    {
      title: 'Document Upload',
      description: 'Upload and process research documents',
      icon: '📄',
      color: 'bg-green-500'
    },
    {
      title: 'Chat Interface',
      description: 'Interact with AI agents',
      icon: '💬',
      color: 'bg-purple-500'
    },
    {
      title: 'Data Analysis',
      description: 'Analyze user research insights',
      icon: '📊',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sirius AI Portal</h1>
              <span className="ml-2 text-sm text-gray-500">v0.1</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{userData.name}</span>
                <span className="text-gray-500 ml-2">({userData.roleLabel})</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Sirius AI Agent Portal
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Your AI-powered platform for user research and agent generation
              </p>
              
              {/* User Info Card */}
              <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{userData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium">{userData.roleLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Login Time:</span>
                    <span className="font-medium text-sm">
                      {new Date(userData.loginTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Available Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-center font-medium transition-colors">
              Generate AI Agent
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-center font-medium transition-colors">
              Upload Document
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-center font-medium transition-colors">
              Start Chat
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Backend API: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Database: Connected</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">AI Service: Ready</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleDashboard;
