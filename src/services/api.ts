// src/services/api.ts

const API_BASE_URL =  'http://localhost:5000/api';

export interface WorkflowResponse {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  stages: Array<{
    name: string;
    description: string;
    actorType: 'USER' | 'ROLE';
    actorName: string;
    actorCount: number;
    anyAllFlag: 'ANY' | 'ALL';
    conflictOfInterestCheck: boolean;
    documents?: {
      required: boolean;
    }[];
  }>;
}

export interface LoginCredentials {
  username: string;
  password: string;
  userType: 'user' | 'role';
  role?: string;
}

class ApiService {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Authentication
  static async login(credentials: LoginCredentials): Promise<{ token: string; user: any }> {
    return this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  }

  // Workflows
  static async getWorkflows(): Promise<WorkflowResponse[]> {
    return this.fetchWithAuth('/workflows');
  }

  static async getWorkflow(id: number): Promise<WorkflowResponse> {
    return this.fetchWithAuth(`/workflows/${id}`);
  }

  static async createWorkflow(workflow: Omit<WorkflowResponse, 'id'>): Promise<WorkflowResponse> {
    return this.fetchWithAuth('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  static async updateWorkflow(id: number, workflow: Partial<WorkflowResponse>): Promise<WorkflowResponse> {
    return this.fetchWithAuth(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  static async deleteWorkflow(id: number): Promise<void> {
    return this.fetchWithAuth(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }
}

export default ApiService;