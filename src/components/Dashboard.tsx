import React, { useState, useEffect } from 'react';
import { Plus, Settings, LogOut, X, Edit, Trash2 } from 'lucide-react';
import ApiService from '../services/api';
import WorkflowWizard from './WorkflowWizard';

interface DashboardProps {
  onLogout: () => void;
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  stages: {
    name: string;
    description: string;
    actorType: 'USER' | 'ROLE';
    actorName: string;
    actorCount: number;
    anyAllFlag: 'ANY' | 'ALL';
    conflictOfInterestCheck: boolean;
    documents?: {
      name: string;
      description: string;
      fileName: string;
      required: boolean;
    }[];
  }[];
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);


  // Load workflows from localStorage on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await ApiService.getWorkflows();
        setWorkflows(data);
      } catch (error) {
        console.error('Failed to load workflows:', error);
      }
    };
    
    loadWorkflows();
  }, []);

  const handleDeleteWorkflow = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await ApiService.deleteWorkflow(id);
        setWorkflows(workflows.filter(w => w.id !== id));
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  {isLoading && (
    <div className="flex justify-center items-center h-64">
      <div className="text-gray-500">Loading workflows...</div>
    </div>
  )}
  
  {error && (
    <div className="text-red-600 text-center py-4">
      {error}
    </div>
  )}
  
  const handleEditComplete = (updatedWorkflow: Workflow) => {
    const updatedWorkflows = workflows.map(w => 
      w.id === updatedWorkflow.id ? updatedWorkflow : w
    );
    setWorkflows(updatedWorkflows);
    localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
    setIsEditing(false);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{workflow.name}</h2>
          
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.status}
                    </span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workflow.description}</dd>
                </div>
              </dl>
            </div>

            {/* Stages */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Stages</h3>
              <div className="space-y-4">
                {workflow.stages.map((stage, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-lg mb-2">{stage.name}</h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="col-span-2">
                        <dt className="text-gray-500">Description</dt>
                        <dd className="text-gray-900">{stage.description}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Actor Type</dt>
                        <dd className="text-gray-900">{stage.actorType}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Actor Name</dt>
                        <dd className="text-gray-900">{stage.actorName}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Actor Count</dt>
                        <dd className="text-gray-900">{stage.actorCount}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Approval Type</dt>
                        <dd className="text-gray-900">{stage.anyAllFlag}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-gray-500">Conflict of Interest Check</dt>
                        <dd className="text-gray-900">
                          {stage.conflictOfInterestCheck ? 'Enabled' : 'Disabled'}
                        </dd>
                      </div>

                      {/* Documents */}
                      {stage.documents && stage.documents.length > 0 && (
                        <div className="col-span-2 mt-4">
                          <dt className="text-gray-500 mb-2">Required Documents</dt>
                          <dd className="space-y-2">
                            {stage.documents.map((doc, docIndex) => (
                              <div key={docIndex} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium">{doc.name}</h5>
                                    <p className="text-sm text-gray-600">{doc.description}</p>
                                    <p className="text-sm text-gray-500">File: {doc.fileName}</p>
                                  </div>
                                  {doc.required && (
                                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isEditing) {
    return (
      <WorkflowWizard 
        onComplete={handleEditComplete} 
        existingWorkflow={selectedWorkflow}
        onCancel={() => setIsEditing(false)}
      />
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="text-lg font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    {workflow.name}
                  </button>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{workflow.description}</p>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {workflow.stages.length} {workflow.stages.length === 1 ? 'Stage' : 'Stages'}
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
                      setSelectedWorkflow(workflow);
                      setIsEditing(true);
                    }}
                    className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                    title="Edit Workflow"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete Workflow"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWorkflow && !isEditing && (
        <WorkflowModal
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;