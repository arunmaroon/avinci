import React from 'react';
import { Button, Card } from './design-system';

const GenerateAgents = ({ onBuildViaDocument, onBuildViaConfig, onGenerateAgents }) => {
  return (
    <Card>
      <h2 className="text-h3 mb-6">Generate New AI Agents</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Build via Document */}
        <div 
          onClick={onBuildViaDocument}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Build via Document</h3>
          <p className="text-sm text-gray-500">Upload research documents and generate agents.</p>
        </div>

        {/* Build via Config */}
        <div 
          onClick={onBuildViaConfig}
          className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Build via Config</h3>
          <p className="text-sm text-gray-500">Configure detailed parameters for agent generation.</p>
        </div>
      </div>

      {/* Quick Generate Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Or generate sample agents instantly to get started
          </p>
          <Button
            onClick={onGenerateAgents}
            variant="primary"
            size="lg"
            className="w-full"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          >
            Generate Sample Agents
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GenerateAgents;
