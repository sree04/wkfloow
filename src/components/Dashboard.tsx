import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, Trash2, Eye, LogOut, X, Rocket, Users, PlusCircle } from 'lucide-react';
import WorkflowWizard from './WorkflowWizard';
import { Workflow } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = (location.state as { userId?: number })?.userId;
  const userRoles = (location.state as { roles?: string[] })?.roles || [];
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const canCreateWorkflow = userRoles.includes('workflow-designer');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchWorkflows();
  }, [userId, navigate]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      console.log('Fetching workflows for user:', userId);
      const response = await axios.get<Workflow[]>('http://localhost:5000/api/workflows');
      console.log('Workflows fetched:', response.data);
      setWorkflows(response.data);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching workflows:', error.response?.data || error.message);
      setError(
        `Failed to fetch workflows: ${error.response?.data?.message || error.message || 'Network error'}`
      );
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can delete workflows.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        setLoading(true);
        console.log('Deleting workflow:', id);
        await axios.delete(`http://localhost:5000/api/workflows/${id}`);
        setWorkflows(workflows.filter(w => w.workflowMasterId !== id));
        setLoading(false);
        console.log('Workflow deleted successfully');
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Error deleting workflow:', error.response?.data || error.message);
        setError(
          `Failed to delete workflow: ${error.response?.data?.message || error.message || 'Network error'}`
        );
        setLoading(false);
      }
    }
  };

  const handleEdit = (workflow: Workflow) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can edit workflows.');
      return;
    }
    console.log('Editing workflow:', workflow);
    setEditingWorkflow(workflow);
    setShowWizard(true);
  };

  const handleViewDetails = (workflow: Workflow) => {
    console.log('Viewing details for workflow:', workflow);
    setSelectedWorkflow(workflow);
  };

  const handleWizardComplete = (workflow: Workflow) => {
    console.log('Wizard completed with workflow:', workflow);
    setWorkflows(prev => {
      const index = prev.findIndex(w => w.workflowMasterId === workflow.workflowMasterId);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = workflow;
        return updated;
      }
      return [...prev, workflow];
    });
    setShowWizard(false);
    setEditingWorkflow(null);
  };

  const handleLogout = () => {
    console.log('Logging out user:', userId);
    navigate('/login');
  };

  const handleLaunchWorkflow = () => {
    console.log('Launching workflow for user:', userId);
    navigate('/launch-workflow', { state: { userId, roles: userRoles } });
  };

  const handleParticipate = () => {
    console.log('Participating in workflows for user:', userId);
    navigate('/participate', { state: { userId, roles: userRoles } });
  };

  if (showWizard) {
    return (
      <WorkflowWizard
        onComplete={handleWizardComplete}
        existingWorkflow={editingWorkflow}
        onCancel={() => {
          setShowWizard(false);
          setEditingWorkflow(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header with subtle gradient background */}
      <header className="bg-gradient-to-r from-purple-700 to-purple-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {/* You can add a logo here if desired */}
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-purple-800" />
                </div>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-white tracking-tight">FlowMaster Hub</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleParticipate}
                className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" /> Participate
              </button>
              <button
                onClick={handleLaunchWorkflow}
                className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Rocket className="h-4 w-4 mr-2" /> Launch Workflow
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-100 hover:bg-purple-800 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Title and Action Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-purple-900">My Workflows</h2>
            <p className="mt-1 text-sm text-purple-600">
              Manage, track, and create your workflow processes
            </p>
          </div>
          {canCreateWorkflow && (
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all hover:shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Create New Workflow
            </button>
          )}
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400 text-purple-700 flex items-center shadow-sm rounded-r-md">
            <div className="animate-spin mr-3 h-5 w-5 border-t-2 border-b-2 border-purple-600 rounded-full" />
            Loading your workflows...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center shadow-sm rounded-r-md">
            <span className="mr-3 text-red-500">⚠️</span>
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {workflows.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-purple-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <Rocket className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No workflows found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Get started by creating your first workflow or check back later for assigned workflows.
            </p>
            {canCreateWorkflow && (
              <div className="mt-6">
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Create New Workflow
                </button>
              </div>
            )}
          </div>
        )}

        {/* Workflow Grid */}
        {workflows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map(workflow => (
              <div
                key={workflow.workflowMasterId}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-purple-100"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-purple-900 truncate" title={workflow.wfdName}>
                      {workflow.wfdName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workflow.wfdStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {workflow.wfdStatus === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10" title={workflow.wfdDesc}>
                    {workflow.wfdDesc}
                  </p>
                  <div className="flex items-center text-xs text-purple-500 mb-4">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {workflow.stages.length} Stage{workflow.stages.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="bg-purple-50 px-5 py-3 flex justify-between items-center">
                  <button
                    onClick={() => handleViewDetails(workflow)}
                    className="text-purple-700 hover:text-purple-900 flex items-center text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  {canCreateWorkflow && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(workflow)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="Edit Workflow"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.workflowMasterId!)}
                        className="text-purple-600 hover:text-red-600 transition-colors"
                        title="Delete Workflow"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Details Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative border-t-4 border-purple-600 animate-fadeIn">
              {/* Close Icon at Top-Right */}
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-purple-900">{selectedWorkflow.wfdName}</h2>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                <p className="text-gray-600 mb-3">{selectedWorkflow.wfdDesc}</p>
                <div className="flex items-center mb-4">
                  <span className="text-sm text-gray-600 mr-2">Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedWorkflow.wfdStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedWorkflow.wfdStatus === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Workflow Stages
                </h3>
                
                {selectedWorkflow.stages.length === 0 ? (
                  <p className="text-gray-600 italic">No stages available for this workflow.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedWorkflow.stages.map((stage, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium mr-2">
                            {index + 1}
                          </span>
                          <h4 className="font-medium text-purple-900">{stage.stageName}</h4>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{stage.stageDesc}</p>
                        
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Actor Type</dt>
                            <dd className="font-medium">{stage.actorType}</dd>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Actor Name</dt>
                            <dd className="font-medium">{stage.actorName}</dd>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Actor Count</dt>
                            <dd className="font-medium">{stage.actorCount}</dd>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Any/All</dt>
                            <dd className="font-medium">{stage.anyAllFlag}</dd>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Conflict Check</dt>
                            <dd className="font-medium">{stage.conflictCheck ? 'Enabled' : 'Disabled'}</dd>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <dt className="text-xs text-purple-700">Documents</dt>
                            <dd className="font-medium">
                              {stage.noOfUploads} ({stage.documentRequired ? 'Required' : 'Optional'})
                            </dd>
                          </div>
                        </dl>
                        
                        {/* Actions Section */}
                        {stage.actions && stage.actions.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <h5 className="text-sm font-medium text-purple-800 mb-2">Available Actions</h5>
                            <ul className="space-y-2">
                              {stage.actions.map((action, aIndex) => (
                                <li key={aIndex} className="text-sm bg-white p-2 border border-gray-100 rounded">
                                  <div className="font-medium">{action.actionName}</div>
                                  <div className="text-xs text-gray-500 flex justify-between">
                                    <span>Next: {action.nextStageType}</span>
                                    <span>Required: {action.requiredCount}</span>
                                  </div>
                                  {action.actionDesc && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {action.actionDesc}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;