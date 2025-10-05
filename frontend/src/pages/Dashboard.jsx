import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        total_agents: 0,
        from_documents: 0,
        manual_created: 0,
        unique_categories: 0
    });
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const agentsRes = await api.get('/agents');
            setAgents(agentsRes.data);
            
            const stats = {
                total_agents: agentsRes.data.length,
                from_documents: agentsRes.data.filter(a => a.source_type === 'document').length,
                manual_created: agentsRes.data.filter(a => a.source_type === 'manual').length,
                unique_categories: new Set(agentsRes.data.map(a => a.category)).size
            };
            
            setStats(stats);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold">AV</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Avinci</h1>
                                <p className="text-sm text-gray-500">AI Agent Designer Tool</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="px-3 py-2 bg-primary-50 rounded-lg">
                                <p className="text-sm font-medium text-primary-700">{user?.role}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Agents</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total_agents}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">From Documents</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.from_documents}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Manual Created</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.manual_created}</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">✍️</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Categories</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.unique_categories}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🏷️</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition font-medium flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">📄</span>
                        Upload Research Document
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 py-4 bg-white border-2 border-primary-500 text-primary-600 rounded-xl hover:bg-primary-50 transition font-medium flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">➕</span>
                        Create Agent Manually
                    </button>
                </div>

                {/* Agents List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">AI Agents ({agents.length})</h2>
                        <button
                            onClick={loadDashboardData}
                            className="text-sm text-primary-600 hover:text-primary-700"
                        >
                            Refresh
                        </button>
                    </div>
                    
                    {agents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🤖</div>
                            <p className="text-gray-500 mb-2">No agents yet</p>
                            <p className="text-sm text-gray-400">Upload a document or create manually</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {agents.map((agent) => (
                                <div key={agent.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition cursor-pointer">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                            {agent.category}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>{agent.age} yrs • {agent.occupation}</p>
                                        <p>Tech: {agent.tech_savviness} • Fin: {agent.financial_savviness}</p>
                                        <p className="text-xs text-gray-500 italic mt-2">"{agent.sample_quote?.substring(0, 60)}..."</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals - Coming Soon */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Create Agent Manually</h3>
                        <p className="text-gray-600 mb-4">Manual agent creation form coming soon!</p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showUploadModal && (
                <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={loadDashboardData} />
            )}
        </div>
    );
};

const UploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('document', file);
        
        try {
            await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert('Document uploaded! Processing agents...');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Upload Research Document</h3>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select File (CSV, Excel, or Text)
                    </label>
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
