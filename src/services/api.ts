// src/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL and port

// Define interfaces based on your database structure
export interface Workflow {
  workflow_master_id?: number;
  wfd_name: string;
  wfd_desc: string;
  wfd_status: string;
  stages?: Stage[];
}

export interface Stage {
  idwfd_stages?: number;
  wf_id: number;
  seq_no: number;
  stage_name: string;
  stage_desc: string;
  stage_actor_id?: number;
  actor_type?: string;
  actor_count?: number;
}

// Workflow API functions
export const workflowApi = {
  // Get all workflows
  getAll: async (): Promise<Workflow[]> => {
    try {
      const response = await axios.get(`${API_URL}/workflows`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },
  
  // Get workflow by ID with its stages
  getById: async (id: number): Promise<Workflow> => {
    try {
      const response = await axios.get(`${API_URL}/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  },
  
  // Create new workflow
  create: async (workflow: Omit<Workflow, 'workflow_master_id'>): Promise<Workflow> => {
    try {
      const response = await axios.post(`${API_URL}/workflows`, workflow);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },
  
  // Add stage to workflow
  addStage: async (workflowId: number, stage: Omit<Stage, 'idwfd_stages' | 'wf_id'>): Promise<Stage> => {
    try {
      const response = await axios.post(`${API_URL}/workflows/${workflowId}/stages`, stage);
      return response.data;
    } catch (error) {
      console.error(`Error adding stage to workflow ${workflowId}:`, error);
      throw error;
    }
  }
};