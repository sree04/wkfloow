import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Plus, Settings, LogOut, X, Edit, Trash2 } from 'lucide-react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkflowWizard from './WorkflowWizard';

interface WorkflowResponse {
  workflow_master_id?: number; // Made optional since it’s auto-generated
  wfd_name: string;
  wfd_desc: string;
  wfd_status: 'active' | 'inactive'; // Match database ENUM
}

interface Workflow extends WorkflowResponse {
  stages: Stage[];
}

interface Stage {
  idwfd_stages?: number;
  wf_id?: number;
  seq_no: number;
  stage_name: string;
  stage_desc: string;
  no_of_uploads: number;
  actor_type: 'role' | 'user'; // Updated to lowercase to match database
  actor_count: number;
  any_all_flag: 'any' | 'all'; // Updated to lowercase to match database
  conflict_check: number;
  document_required: number;
  actor_name: string;
}

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRoles = (location.state as { roles: string[] })?.roles || [];

  // Restrict workflow creation to Workflow Designer
  const canCreateWorkflow = userRoles.includes('workflow-designer');

  // Fetch workflows from the backend
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      console.log('Sending GET request to /api/workflows'); // Debug log
      const response = await axios.get<Workflow[]>('http://localhost:5000/api/workflows');
      console.log('Fetched workflows:', response.data); // Debug log
      setWorkflows(response.data);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching workflows:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
        config: error.config ? error.config.url : 'No config URL',
      });
      setError(`Failed to load workflows: ${error.response?.data?.message || error.message || 'Route not found'}`);
      setLoading(false);
    }
  };

  // Fetch workflows on component mount
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDeleteWorkflow = (workflowId: number | undefined) => {
    if (!canCreateWorkflow) {
      setError('Only Workflow Designers can delete workflows.');
      return;
    }
    if (!workflowId) {
      setError('Invalid workflow ID. Cannot delete.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setLoading(true);
      axios.delete(`http://localhost:5000/api/workflows/${workflowId}`)
        .then(() => {
          fetchWorkflows(); // Refresh workflows after deletion
          setLoading(false);
        })
        .catch(err => {
          const error = err as AxiosError<{ message?: string }>;
          setError(`Failed to delete workflow: ${error.response?.data?.message || error.message || 'Network error'}`);
          setLoading(false);
        });
    }
  };

  const handleEditComplete = (workflow: Workflow) => {
    if (!canCreateWorkflow) {
      setError('Only Workflow Designers can edit workflows.');
      return;
    }
    fetchWorkflows(); // Refresh workflows from the backend after edit
    setIsEditing(false);
    setSelectedWorkflow(undefined);
  };

  const WorkflowModal: React.FC<{ workflow: Workflow; onClose: () => void }> = ({ workflow, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{workflow.wfd_name}</h2>
          
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.wfd_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.wfd_status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workflow.wfd_desc}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Stages</h3>
              <div className="space-y-4">
                {workflow.stages && workflow.stages.length > 0 ? (
                  workflow.stages.map((stage, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-lg mb-2">{stage.stage_name}</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="col-span-2">
                          <dt className="text-gray-500">Description</dt>
                          <dd className="text-gray-900">{stage.stage_desc}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Type</dt>
                          <dd className="text-gray-900">{stage.actor_type}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Name</dt>
                          <dd className="text-gray-900">{stage.actor_name}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Count</dt>
                          <dd className="text-gray-900">{stage.actor_count}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Approval Type</dt>
                          <dd className="text-gray-900">{stage.any_all_flag}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-gray-500">Conflict of Interest Check</dt>
                          <dd className="text-gray-900">
                            {stage.conflict_check ? 'Enabled' : 'Disabled'}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-gray-500">Documents Required</dt>
                          <dd className="text-gray-900">
                            {stage.no_of_uploads} ({stage.document_required ? 'Yes' : 'No'})
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">No stages available for this workflow.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
          <span className="animate-spin text-purple-600">⏳</span>
          <p className="text-gray-600 mt-4">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/welcome')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Welcome
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                if (canCreateWorkflow) {
                  setIsEditing(true);
                } else {
                  setError('Only Workflow Designers can create new workflows.');
                }
              }}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
              }`}
              disabled={loading || !canCreateWorkflow}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Workflow
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workflows && workflows.length > 0 ? (
            workflows.map((workflow) => (
              <div
                key={workflow.workflow_master_id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="text-lg font-medium text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      {workflow.wfd_name}
                    </button>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workflow.wfd_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {workflow.wfd_status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{workflow.wfd_desc}</p>
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">
                      {workflow.stages ? workflow.stages.length : 0} {workflow.stages && workflow.stages.length === 1 ? 'Stage' : 'Stages'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="text-sm text-purple-600 hover:text-purple-900 font-medium inline-flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (canCreateWorkflow) {
                          setSelectedWorkflow(workflow);
                          setIsEditing(true);
                        } else {
                          setError('Only Workflow Designers can edit workflows.');
                        }
                      }}
                      className={`p-1 text-gray-500 hover:text-purple-600 transition-colors ${
                        loading ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title="Edit Workflow"
                      disabled={loading || !canCreateWorkflow}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(workflow.workflow_master_id)}
                      className={`p-1 text-gray-500 hover:text-red-600 transition-colors ${
                        loading ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title="Delete Workflow"
                      disabled={loading || !canCreateWorkflow}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No workflows found.
            </div>
          )}
        </div>

        {selectedWorkflow && !isEditing && (
          <WorkflowModal
            workflow={selectedWorkflow}
            onClose={() => setSelectedWorkflow(undefined)}
          />
        )}

        {isEditing && (
          <WorkflowWizard 
            onComplete={handleEditComplete} 
            onCancel={() => setIsEditing(false)}
            existingWorkflow={selectedWorkflow}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;