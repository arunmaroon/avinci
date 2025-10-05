import React from 'react';

const AgentStats = ({ agents = [] }) => {
  const activeCount = agents.length; // All agents are considered active for now
  const sleepingCount = 0; // Placeholder
  const avgConfidence = agents.length > 0 ? '85%' : '0%'; // Placeholder calculation

  const stats = [
    { label: 'Total Agents', value: agents.length.toString(), icon: '🗄️', color: 'text-gray-700' },
    { label: 'Active', value: activeCount.toString(), icon: '✅', color: 'text-green-600' },
    { label: 'Sleeping', value: sleepingCount.toString(), icon: '🌙', color: 'text-yellow-600' },
    { label: 'Avg Confidence', value: avgConfidence, icon: '⭐', color: 'text-purple-600' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentStats;
