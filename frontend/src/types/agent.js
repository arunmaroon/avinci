// Agent types and interfaces
// Note: This is a JavaScript file, so we'll use JSDoc comments for type information

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} persona
 * @property {'Novice'|'Intermediate'|'Advanced'|'Expert'} knowledgeLevel
 * @property {'Formal'|'Casual'|'Technical'|'Conversational'} languageStyle
 * @property {'Reserved'|'Moderate'|'Expressive'|'Highly Expressive'} emotionalRange
 * @property {'Low'|'Medium'|'High'} hesitationLevel
 * @property {string[]} traits
 * @property {string} prompt
 * @property {string} [avatar]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} text
 * @property {string} [image]
 * @property {boolean} isUser
 * @property {string} timestamp
 * @property {string} [agentId]
 * @property {Object} [metadata]
 * @property {number} [metadata.tokens]
 * @property {number} [metadata.processingTime]
 * @property {string} [metadata.model]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} agentId
 * @property {Message[]} messages
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ChatState
 * @property {Object} conversations
 * @property {Message[]} conversations.left
 * @property {Message[]} conversations.right
 * @property {Object} isGenerating
 * @property {boolean} isGenerating.left
 * @property {boolean} isGenerating.right
 * @property {Object} selectedAgents
 * @property {string|null} selectedAgents.left
 * @property {string|null} selectedAgents.right
 */

/**
 * @typedef {Object} AgentPrompt
 * @property {string} systemPrompt
 * @property {string} userPrompt
 * @property {string[]} traits
 * @property {string} knowledgeLevel
 * @property {string} languageStyle
 * @property {string} emotionalRange
 * @property {string} hesitationLevel
 */

/**
 * @typedef {Object} ChatRequest
 * @property {string} agentId
 * @property {Object} message
 * @property {string} message.text
 * @property {File} [message.image]
 * @property {Message[]} conversationHistory
 */

/**
 * @typedef {Object} ChatResponse
 * @property {Message} message
 * @property {string} agentId
 * @property {number} processingTime
 * @property {number} tokens
 */

// Export empty object since this is just for type definitions
module.exports = {};
