import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GenerationStatus = ({ isVisible, onComplete, onClose, generationType = 'sample', documents = null, config = null }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { id: 1, name: 'Initializing', description: 'Setting up agent generation environment...', duration: 2000 },
    { id: 2, name: 'Processing Documents', description: 'Analyzing uploaded documents and extracting user data...', duration: 3000 },
    { id: 3, name: 'Generating Personas', description: 'Creating diverse user personas based on research data...', duration: 4000 },
    { id: 4, name: 'Configuring AI Models', description: 'Setting up GPT-4o with custom prompts and personality traits...', duration: 2000 },
    { id: 5, name: 'Testing Agents', description: 'Validating agent responses and behavior patterns...', duration: 3000 },
    { id: 6, name: 'Finalizing', description: 'Saving agents to database and preparing for use...', duration: 2000 }
  ];

  useEffect(() => {
    if (!isVisible || isGenerating) return;

    const generateAgents = async () => {
      setIsGenerating(true);
      let stepIndex = 0;
      let progressInterval;
      let stepTimeout;

      const runStep = () => {
        if (stepIndex >= steps.length) {
          setStatus('✅ Agent generation completed successfully!');
          setProgress(100);
          setTimeout(() => {
            onComplete();
            setIsGenerating(false);
          }, 2000);
          return;
        }

        const step = steps[stepIndex];
        setCurrentStep(step.id);
        setStatus(step.description);
        
        // Animate progress for this step
        const stepProgress = ((stepIndex + 1) / steps.length) * 100;
        let currentProgress = (stepIndex / steps.length) * 100;
        
        progressInterval = setInterval(() => {
          currentProgress += 2;
          if (currentProgress >= stepProgress) {
            currentProgress = stepProgress;
            clearInterval(progressInterval);
          }
          setProgress(currentProgress);
        }, 50);

        stepTimeout = setTimeout(async () => {
          // Make API call on the last step
          if (stepIndex === steps.length - 1) {
            try {
              if (generationType === 'sample') {
                await fetch('http://localhost:4000/api/generate/sample', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
              } else if (generationType === 'documents' && documents && config) {
                const formData = new FormData();
                documents.forEach((file, index) => {
                  formData.append('documents', file);
                });
                formData.append('numberOfAgents', config.numberOfAgents);
                formData.append('techSavviness', config.techSavviness);
                formData.append('englishLevel', config.englishLevel);
                formData.append('fintechSavviness', config.fintechSavviness);
                formData.append('demographicDiversity', config.demographicDiversity);

                await fetch('http://localhost:4000/api/generate/from-documents', {
                  method: 'POST',
                  body: formData
                });
              }
            } catch (error) {
              console.error('Error generating agents:', error);
              setStatus('❌ Error generating agents. Please try again.');
              setTimeout(() => {
                onClose();
                setIsGenerating(false);
              }, 3000);
              return;
            }
          }
          
          stepIndex++;
          runStep();
        }, step.duration);
      };

      runStep();

      return () => {
        if (progressInterval) clearInterval(progressInterval);
        if (stepTimeout) clearTimeout(stepTimeout);
      };
    };

    generateAgents();

    return () => {
      setIsGenerating(false);
    };
  }, [isVisible, generationType, documents, config, onComplete, onClose]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generating AI Agents
            </h3>
            
            <p className="text-gray-600 mb-6">
              Please wait while we create your personalized AI agents...
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <motion.div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="text-sm text-gray-500 mb-4">
              {Math.round(progress)}% Complete
            </div>

            {/* Current Step */}
            <div className="text-left space-y-2 mb-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 p-2 rounded ${
                    step.id === currentStep
                      ? 'bg-blue-50 border border-blue-200'
                      : step.id < currentStep
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : step.id === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    {step.id === currentStep && (
                      <div className="text-sm text-gray-600">
                        {status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Status Message */}
            <div className="text-sm text-gray-600 mb-4">
              {status}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Cancel Generation
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenerationStatus;
