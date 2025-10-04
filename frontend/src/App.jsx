import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgentGeneration from './pages/AgentGeneration';
import AgentLibrary from './pages/AgentLibrary';
import ChatInterface from './pages/ChatInterface';
import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './styles/globals.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/*" element={<ProtectedApp />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

function ProtectedApp() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/generate" element={<AgentGeneration />} />
                <Route path="/agents" element={<AgentLibrary />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

export default App;
