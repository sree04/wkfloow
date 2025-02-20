import api from './api';
import { Workflow, Stage, PaginatedResponse } from './workflowTypes';

// Custom error class to handle API errors gracefully
class WorkflowServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'WorkflowServiceError';
  }
}

export const workflowService = {
  /**
   * Fetch all workflows with pagination
   * @param {number} page - The page number
   * @param {number} limit - Number of workflows per page
   * @returns {Promise<PaginatedResponse<Workflow>>} - List of workflows
   */
  getAllWorkflows: async (page = 1, limit = 10) => {
    try {
      const response = await api.get<PaginatedResponse<Workflow>>(
        `/workflows?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      throw new WorkflowServiceError(
        'Failed to fetch workflows',
        error.response?.status,
        error.response?.data
      );
    }
  },

  /**
   * Fetch a single workflow by ID, including its stages
   * @param {number} id - Workflow ID
   * @returns {Promise<Workflow & { stages: Stage[] }>} - Workflow details with stages
   */
  getWorkflowById: async (id: number) => {
    try {
      const response = await api.get<Workflow & { stages: Stage[] }>(
        `/workflows/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new WorkflowServiceError(
        `Failed to fetch workflow #${id}`,
        error.response?.status,
        error.response?.data
      );
    }
  },

  /**
   * Create a new workflow
   * @param {Omit<Workflow, 'workflow_master_id' | 'created_at' | 'updated_at'>} workflowData - Workflow details (without auto-generated fields)
   * @returns {Promise<Workflow>} - Created workflow object
   */
  createWorkflow: async (workflowData: Omit<Workflow, 'workflow_master_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.post<Workflow>('/workflows', workflowData);
      return response.data;
    } catch (error: any) {
      throw new WorkflowServiceError(
        'Failed to create workflow',
        error.response?.status,
        error.response?.data
      );
    }
  },

  /**
   * Update an existing workflow
   * @param {number} id - Workflow ID
   * @param {Partial<Workflow>} workflowData - Updated workflow data
   * @returns {Promise<Workflow>} - Updated workflow object
   */
  updateWorkflow: async (id: number, workflowData: Partial<Workflow>) => {
    try {
      const response = await api.put<Workflow>(`/workflows/${id}`, workflowData);
      return response.data;
    } catch (error: any) {
      throw new WorkflowServiceError(
        `Failed to update workflow #${id}`,
        error.response?.status,
        error.response?.data
      );
    }
  },

  /**
   * Add a new stage to a workflow
   * @param {number} workflowId - ID of the workflow
   * @param {Omit<Stage, 'idwfd_stages' | 'wf_id'>} stageData - Stage details (excluding auto-generated fields)
   * @returns {Promise<Stage>} - Created stage object
   */
  addStage: async (workflowId: number, stageData: Omit<Stage, 'idwfd_stages' | 'wf_id'>) => {
    try {
      const response = await api.post<Stage>(
        `/workflows/${workflowId}/stages`,
        stageData
      );
      return response.data;
    } catch (error: any) {
      throw new WorkflowServiceError(
        'Failed to add stage',
        error.response?.status,
        error.response?.data
      );
    }
  },

  /**
   * Validate if a given workflow status is allowed
   * @param {string} status - Status to validate
   * @returns {boolean} - True if status is valid, otherwise false
   */
  isValidStatus: (status: string): status is Workflow['wfd_status'] => {
    return ['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status);
  }
};
