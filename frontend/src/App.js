import React from 'react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">AV</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Welcome to Avinci
        </h1>
        <p className="text-center text-gray-600 mb-6">
          AI-Powered User Research Platform
        </p>
        <button className="btn-primary w-full">
          Get Started
        </button>
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 text-center">
            ✅ Frontend is working correctly!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
