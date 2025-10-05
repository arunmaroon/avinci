import { useState, useCallback } from 'react';

export const useAgentChat = () => {
  const [conversations, setConversations] = useState({
    left: [],
    right: []
  });

  const [isGenerating, setIsGenerating] = useState({
    left: false,
    right: false
  });

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addUserMessage = useCallback((side: 'left' | 'right', message: { text: string; image?: File; timestamp: string }) => {
    const userMessage: Message = {
      id: generateMessageId(),
      text: message.text,
      image: message.image ? URL.createObjectURL(message.image) : undefined,
      isUser: true,
      timestamp: message.timestamp
    };

    setConversations(prev => ({
      ...prev,
      [side]: [...prev[side], userMessage]
    }));
  }, []);

  const addAgentMessage = useCallback((side: 'left' | 'right', message: Message) => {
    setConversations(prev => ({
      ...prev,
      [side]: [...prev[side], message]
    }));
  }, []);

  const sendMessage = useCallback(async (
    agentId: string, 
    message: { text: string; image?: File; timestamp: string }, 
    side: 'left' | 'right'
  ) => {
    // Add user message immediately
    addUserMessage(side, message);

    // Set generating state
    setIsGenerating(prev => ({ ...prev, [side]: true }));

    try {
      // Prepare the request
      const formData = new FormData();
      formData.append('agentId', agentId);
      formData.append('text', message.text);
      formData.append('timestamp', message.timestamp);
      
      if (message.image) {
        formData.append('image', message.image);
      }

      // Add conversation history
      const currentConversation = conversations[side];
      formData.append('conversationHistory', JSON.stringify(currentConversation));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const chatResponse: ChatResponse = await response.json();

      // Add agent response
      addAgentMessage(side, chatResponse.message);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateMessageId(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date().toISOString(),
        agentId
      };
      
      addAgentMessage(side, errorMessage);
    } finally {
      // Clear generating state
      setIsGenerating(prev => ({ ...prev, [side]: false }));
    }
  }, [conversations, addUserMessage, addAgentMessage]);

  const clearConversation = useCallback(() => {
    setConversations({
      left: [],
      right: []
    });
  }, []);

  const clearSideConversation = useCallback((side: 'left' | 'right') => {
    setConversations(prev => ({
      ...prev,
      [side]: []
    }));
  }, []);

  return {
    conversations,
    isGenerating,
    sendMessage,
    clearConversation,
    clearSideConversation
  };
};
