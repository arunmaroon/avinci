import React, { useState, useEffect } from 'react';
import AgentStats from '../components/AgentStats';
import GenerateAgents from '../components/GenerateAgents';
import SearchFilters from '../components/SearchFilters';
import EmptyState from '../components/EmptyState';
import DocumentUpload from '../components/DocumentUpload';
import GenerationStatus from '../components/GenerationStatus';
import AgentGrid from '../components/AgentGrid';
import { useAgentStore } from '../stores/agentStore';

const AIAgents = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [showGenerationStatus, setShowGenerationStatus] = useState(false);
  const [generationType, setGenerationType] = useState('sample');
  const [generationData, setGenerationData] = useState(null);
  
  const { agents, loading, fetchAgents } = useAgentStore();

  const tabs = [
    { id: 'view', label: `View Agents (${agents.length})`, icon: '👤' },
    { id: 'upload', label: 'Document Upload', icon: '📄' },
    { id: 'config', label: 'Configuration', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleGenerateAgents = (data = null) => {
    if (data) {
      setGenerationType('documents');
      setGenerationData(data);
    } else {
      setGenerationType('sample');
      setGenerationData(null);
    }
    setShowGenerationStatus(true);
  };

  const handleGenerationComplete = () => {
    setShowGenerationStatus(false);
    // Refresh agents list
    fetchAgents();
  };

  const handleSelectAgent = (agent) => {
    // Navigate to agent preview or open agent details
    console.log('Selected agent:', agent);
  };

  const handleDeleteAgent = async (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      // Implement delete functionality
      console.log('Delete agent:', agentId);
      fetchAgents(); // Refresh list
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Status Modal */}
      <GenerationStatus
        isVisible={showGenerationStatus}
        onComplete={handleGenerationComplete}
        onClose={() => setShowGenerationStatus(false)}
        generationType={generationType}
        documents={generationData?.files}
        config={generationData}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
        <p className="text-gray-600 mt-2">Create and manage AI-generated user personas</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' && (
        <>
          {/* Generate New AI Agents Section */}
          <GenerateAgents 
            onBuildViaDocument={() => setActiveTab('upload')} 
            onBuildViaConfig={() => setActiveTab('config')}
            onGenerateAgents={handleGenerateAgents}
          />

          {/* Agent Statistics */}
          <AgentStats agents={agents} />

          {/* Search and Filters */}
          <SearchFilters />

          {/* Agents Grid or Empty State */}
          {agents.length > 0 ? (
            <AgentGrid 
              agents={agents}
              onSelectAgent={handleSelectAgent}
              onDeleteAgent={handleDeleteAgent}
            />
          ) : (
            <EmptyState />
          )}
        </>
      )}

      {activeTab === 'upload' && (
        <DocumentUpload onGenerateAgents={handleGenerateAgents} />
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
          <p className="text-gray-600">Configuration settings will be available here.</p>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
