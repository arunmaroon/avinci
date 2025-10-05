import React, { useState } from 'react';

const DocumentUpload = ({ onGenerateAgents }) => {
  const [numberOfAgents, setNumberOfAgents] = useState(5);
  const [techSavviness, setTechSavviness] = useState('medium');
  const [englishLevel, setEnglishLevel] = useState('fluent');
  const [fintechSavviness, setFintechSavviness] = useState('medium');
  const [demographicDiversity, setDemographicDiversity] = useState('balanced');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Supported file types
  const supportedTypes = {
    'pdf': { icon: '📄', color: 'text-red-500' },
    'doc': { icon: '📝', color: 'text-blue-500' },
    'docx': { icon: '📝', color: 'text-blue-500' },
    'txt': { icon: '📄', color: 'text-gray-500' },
    'rtf': { icon: '📄', color: 'text-gray-500' },
    'odt': { icon: '📄', color: 'text-orange-500' },
    'xls': { icon: '📊', color: 'text-green-500' },
    'xlsx': { icon: '📊', color: 'text-green-500' },
    'ppt': { icon: '📊', color: 'text-orange-500' },
    'pptx': { icon: '📊', color: 'text-orange-500' },
    'csv': { icon: '📊', color: 'text-green-500' },
    'json': { icon: '🔧', color: 'text-yellow-500' },
    'xml': { icon: '🔧', color: 'text-yellow-500' },
    'md': { icon: '📝', color: 'text-gray-500' },
    'html': { icon: '🌐', color: 'text-orange-500' },
    'htm': { icon: '🌐', color: 'text-orange-500' }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return supportedTypes[extension] || { icon: '📄', color: 'text-gray-500' };
  };

  const validateFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!supportedTypes[extension]) {
      return { valid: false, error: `Unsupported file type: .${extension}` };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    return { valid: true };
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert(`Some files could not be uploaded:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert(`Some files could not be uploaded:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document before generating agents.');
      return;
    }
    
    console.log('Generating agents with:', {
      numberOfAgents,
      techSavviness,
      englishLevel,
      fintechSavviness,
      demographicDiversity,
      files: uploadedFiles
    });
    
    // Trigger the generation process
    if (onGenerateAgents) {
      onGenerateAgents({
        numberOfAgents,
        techSavviness,
        englishLevel,
        fintechSavviness,
        demographicDiversity,
        files: uploadedFiles
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Document-Based Agent Creation Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Document-Based Agent Creation</h2>
            <p className="text-sm text-gray-600">Upload documents containing real user data to generate authentic AI agents.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mb-2">PDF, DOC, DOCX, TXT, RTF, ODT, XLS, XLSX, PPT, PPTX, CSV, JSON, XML, MD, HTML files (Max 10MB each)</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <span>📄</span>
                <span>Documents</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📊</span>
                <span>Spreadsheets</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🔧</span>
                <span>Data Files</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🌐</span>
                <span>Web Files</span>
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.csv,.json,.xml,.md,.html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files ({uploadedFiles.length}):</h4>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => {
                  const fileInfo = getFileIcon(file.name);
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg ${fileInfo.color}`}>{fileInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 font-medium truncate block">{file.name}</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span className="uppercase">{file.name.split('.').pop()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Number of Agents Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Agents: {numberOfAgents}
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={numberOfAgents}
              onChange={(e) => setNumberOfAgents(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-500">10</span>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Focus Areas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tech Savviness</label>
              <select
                value={techSavviness}
                onChange={(e) => setTechSavviness(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low (Basic smartphone use)</option>
                <option value="medium">Medium (Apps & digital payments)</option>
                <option value="high">High (Advanced tech user)</option>
                <option value="expert">Expert (Tech professional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">English Level</label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="basic">Basic (Simple phrases)</option>
                <option value="intermediate">Intermediate (Conversational)</option>
                <option value="fluent">Fluent (Professional level)</option>
                <option value="native">Native (Native speaker)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fintech Savviness</label>
              <select
                value={fintechSavviness}
                onChange={(e) => setFintechSavviness(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low (Cash only)</option>
                <option value="medium">Medium (UPI & digital payments)</option>
                <option value="high">High (Multiple fintech apps)</option>
                <option value="expert">Expert (Crypto & advanced finance)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Demographic Diversity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Demographic Diversity</label>
          <select
            value={demographicDiversity}
            onChange={(e) => setDemographicDiversity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="balanced">Balanced Mix</option>
            <option value="young">Young Adults (18-25)</option>
            <option value="middle">Middle-aged (26-45)</option>
            <option value="senior">Senior (45+)</option>
            <option value="urban">Urban Focus</option>
            <option value="rural">Rural Focus</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Generate {numberOfAgents} AI Agents from Documents</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
