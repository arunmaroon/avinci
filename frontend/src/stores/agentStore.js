import { create } from 'zustand';

export const useAgentStore = create((set, get) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const agents = await response.json();
      set({ agents, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  createAgent: async (agentData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create agent');
      }
      
      const newAgent = await response.json();
      set(state => ({
        agents: [...state.agents, newAgent],
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  updateAgent: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update agent');
      }
      
      const updatedAgent = await response.json();
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === id ? updatedAgent : agent
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  deleteAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      
      set(state => ({
        agents: state.agents.filter(agent => agent.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  getAgentById: (id) => {
    return get().agents.find(agent => agent.id === id);
  },
}));
