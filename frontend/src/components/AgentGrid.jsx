import React from 'react';
import { motion } from 'framer-motion';

const AgentGrid = ({ agents, onSelectAgent, onDeleteAgent }) => {
  const getAgentColor = (knowledgeLevel) => {
    switch (knowledgeLevel) {
      case 'Novice': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPersonaIcon = (persona) => {
    if (persona.toLowerCase().includes('tech')) return '💻';
    if (persona.toLowerCase().includes('business')) return '💼';
    if (persona.toLowerCase().includes('professional')) return '👔';
    if (persona.toLowerCase().includes('executive')) return '🎯';
    if (persona.toLowerCase().includes('traditional')) return '🏢';
    return '👤';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelectAgent && onSelectAgent(agent)}
        >
          {/* Agent Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                {getPersonaIcon(agent.persona)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                <p className="text-sm text-gray-600">{agent.persona}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAgent && onSelectAgent(agent);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Preview Agent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAgent && onDeleteAgent(agent.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Agent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Agent Traits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Knowledge Level</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getAgentColor(agent.knowledgeLevel)}`}>
                {agent.knowledgeLevel}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Language Style</span>
              <span className="text-sm font-medium text-gray-900">{agent.languageStyle}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Emotional Range</span>
              <span className="text-sm font-medium text-gray-900">{agent.emotionalRange}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Hesitation</span>
              <span className="text-sm font-medium text-gray-900">{agent.hesitationLevel}</span>
            </div>
          </div>

          {/* Traits Tags */}
          {agent.traits && agent.traits.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-1">
                {agent.traits.slice(0, 3).map((trait, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {trait}
                  </span>
                ))}
                {agent.traits.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{agent.traits.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Agent Preview */}
          {agent.prompt && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 line-clamp-3">
                {agent.prompt.substring(0, 120)}...
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AgentGrid;
