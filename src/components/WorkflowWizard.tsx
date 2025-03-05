import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { ArrowRight, Plus, Save, AlertCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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

interface WorkflowWizardProps {
  onComplete: (workflow: Workflow) => void;
  existingWorkflow?: Workflow;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3;

const AVAILABLE_ROLES = [
  { value: 'designer', label: 'Workflow Designer' },
  { value: 'admin', label: 'System Administrator' },
  { value: 'reviewer', label: 'Content Reviewer' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'approver', label: 'Financial Approver' },
  { value: 'auditor', label: 'System Auditor' },
  { value: 'supervisor', label: 'Team Supervisor' },
  { value: 'coordinator', label: 'Process Coordinator' },
];

const inputStyles = "mt-1 block w-full rounded-md border-2 border-purple-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50";

const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ onComplete, existingWorkflow, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [workflowName, setWorkflowName] = useState(existingWorkflow?.wfd_name || '');
  const [workflowDesc, setWorkflowDesc] = useState(existingWorkflow?.wfd_desc || '');
  const [workflowStatus, setWorkflowStatus] = useState<'active' | 'inactive'>(existingWorkflow?.wfd_status || 'active');
  const [stages, setStages] = useState<Stage[]>(existingWorkflow?.stages || []);
  const [currentStage, setCurrentStage] = useState({
    name: '',
    description: '',
    actorType: 'role' as 'role' | 'user', // Updated to lowercase to match database
    actorName: '',
    actorCount: 1,
    any_all_flag: 'any' as 'any' | 'all', // Updated to lowercase to match database
    conflictOfInterestCheck: false,
    documentCount: 0,
    documents: [] as { required: boolean }[],
  });
  const [workflowId, setWorkflowId] = useState<number | null>(existingWorkflow?.workflow_master_id || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireDocuments, setRequireDocuments] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const userRoles = (location.state as { roles: string[] })?.roles || [];

  // Restrict workflow creation to Workflow Designer
  const canCreateWorkflow = userRoles.includes('workflow-designer');

  useEffect(() => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create or manage workflows.');
      return;
    }

    const fetchWorkflow = async () => {
      if (existingWorkflow?.workflow_master_id) {
        try {
          setLoading(true);
          const response = await axios.get<Workflow>(`http://localhost:5000/api/workflows/${existingWorkflow.workflow_master_id}`);
          console.log('Fetched existing workflow:', response.data);
          const workflowData = response.data;
          setWorkflowName(workflowData.wfd_name);
          setWorkflowDesc(workflowData.wfd_desc);
          setWorkflowStatus(workflowData.wfd_status);
          setStages(workflowData.stages || []);
          setWorkflowId(workflowData.workflow_master_id || null);
          setLoading(false);
        } catch (err) {
          const error = err as AxiosError<{ message?: string }>;
          console.error('Error fetching workflow:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response data',
            status: error.response ? error.response.status : 'No status',
          });
          setError(`Failed to load workflow data: ${error.response?.data?.message || error.message || 'Network error'}`);
          setLoading(false);
        }
      }
    };
    fetchWorkflow();
  }, [existingWorkflow, canCreateWorkflow]);

  const validateStep1 = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create workflows.');
      return false;
    }
    console.log('Validating Step 1, workflow:', { workflowName, workflowDesc });
    if (!workflowName.trim()) {
      setError('Workflow name is required');
      return false;
    }
    if (!workflowDesc.trim()) {
      setError('Workflow description is required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can manage stages.');
      return false;
    }
    console.log('Validating Step 2, stages:', stages);
    if (stages.length === 0) {
      setError('At least one stage is required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateCurrentStage = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can add or edit stages.');
      return false;
    }
    if (!currentStage.name.trim()) {
      setError('Stage name is required');
      return false;
    }
    if (!currentStage.description.trim()) {
      setError('Stage description is required');
      return false;
    }
    if (!currentStage.actorName.trim()) {
      setError('Actor name is required');
      return false;
    }
    if (currentStage.actorCount < 1) {
      setError('Actor count must be at least 1');
      return false;
    }
    setError(null);
    return true;
  };

  const createWorkflowIfNeeded = async (): Promise<number | null> => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create workflows.');
      return null;
    }
    if (workflowId) return workflowId;

    try {
      setLoading(true);
      console.log('Sending POST /api/workflows with:', {
        wfd_name: workflowName,
        wfd_desc: workflowDesc,
        wfd_status: workflowStatus,
      });
      const response = await axios.post<WorkflowResponse>('http://localhost:5000/api/workflows', {
        wfd_name: workflowName,
        wfd_desc: workflowDesc,
        wfd_status: workflowStatus,
      });
      const newWorkflowId = response.data.workflow_master_id;
      if (typeof newWorkflowId !== 'number' || isNaN(newWorkflowId)) {
        throw new Error('Invalid workflow ID received from server');
      }
      console.log('Received workflow ID:', newWorkflowId);
      setWorkflowId(newWorkflowId);
      setLoading(false);
      return newWorkflowId;
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error creating workflow:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
      });
      setError(`Failed to create workflow: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
      return null;
    }
  };

  const handleAddStage = async () => {
    if (!validateCurrentStage()) return;

    const wfId = await createWorkflowIfNeeded();
    if (!wfId || !canCreateWorkflow) return;

    const stageData: Partial<Stage> = {
      seq_no: stages.length + 1,
      stage_name: currentStage.name,
      stage_desc: currentStage.description,
      no_of_uploads: currentStage.documentCount,
      actor_type: currentStage.actorType,
      actor_name: currentStage.actorName,
      actor_count: currentStage.actorCount,
      any_all_flag: currentStage.any_all_flag,
      conflict_check: currentStage.conflictOfInterestCheck ? 1 : 0,
      document_required: requireDocuments ? 1 : 0,
      wf_id: wfId,
    };

    try {
      setLoading(true);
      console.log('Sending POST /api/workflows/', wfId, '/stages with:', stageData);
      const response = await axios.post<Stage>(`http://localhost:5000/api/workflows/${wfId}/stages`, stageData);
      console.log('Stage added with response:', response.data);
      setStages([...stages, response.data]);
      setCurrentStage({
        name: '',
        description: '',
        actorType: 'role',
        actorName: '',
        actorCount: 1,
        any_all_flag: 'any',
        conflictOfInterestCheck: false,
        documentCount: 0,
        documents: [],
      });
      setRequireDocuments(false);
      setEditingStageIndex(null);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error adding stage:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
        requestData: stageData,
      });
      setError(`Failed to add stage: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleEditStage = async (index: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can edit stages.');
      return;
    }
    const stageToEdit = stages[index];
    if (!stageToEdit || !stageToEdit.idwfd_stages) {
      setError('Invalid stage selected for editing.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get<Stage>(`http://localhost:5000/api/workflows/${workflowId}/stages/${stageToEdit.idwfd_stages}`);
      const fetchedStage = response.data;
      console.log('Fetched stage for editing:', fetchedStage);
      setEditingStageIndex(index);
      setCurrentStage({
        name: fetchedStage.stage_name,
        description: fetchedStage.stage_desc,
        actorType: fetchedStage.actor_type,
        actorName: fetchedStage.actor_name,
        actorCount: fetchedStage.actor_count,
        any_all_flag: fetchedStage.any_all_flag,
        conflictOfInterestCheck: !!fetchedStage.conflict_check,
        documentCount: fetchedStage.no_of_uploads,
        documents: fetchedStage.no_of_uploads > 0 ? Array(fetchedStage.no_of_uploads).fill({ required: !!fetchedStage.document_required }) : [],
      });
      setRequireDocuments(!!fetchedStage.document_required);
      setCurrentStep(2);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching stage for editing:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
      });
      setError(`Failed to load stage for editing: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleUpdateStage = async () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can update stages.');
      return;
    }
    if (!validateCurrentStage() || editingStageIndex === null || !stages[editingStageIndex]?.idwfd_stages) {
      setError('Invalid stage or validation failed.');
      return;
    }

    const wfId = workflowId;
    if (!wfId) {
      setError('Workflow ID not found.');
      return;
    }

    const stageData: Partial<Stage> = {
      seq_no: stages[editingStageIndex].seq_no,
      stage_name: currentStage.name,
      stage_desc: currentStage.description,
      no_of_uploads: currentStage.documentCount,
      actor_type: currentStage.actorType,
      actor_name: currentStage.actorName,
      actor_count: currentStage.actorCount,
      any_all_flag: currentStage.any_all_flag,
      conflict_check: currentStage.conflictOfInterestCheck ? 1 : 0,
      document_required: requireDocuments ? 1 : 0,
    };

    try {
      setLoading(true);
      console.log('Sending PUT /api/workflows/', wfId, '/stages/', stages[editingStageIndex].idwfd_stages, 'with:', stageData);
      const response = await axios.put<Stage>(`http://localhost:5000/api/workflows/${wfId}/stages/${stages[editingStageIndex].idwfd_stages}`, stageData);
      console.log('Stage updated with response:', response.data);

      const updatedStages = [...stages];
      updatedStages[editingStageIndex] = response.data;
      setStages(updatedStages);
      setCurrentStage({
        name: '',
        description: '',
        actorType: 'role',
        actorName: '',
        actorCount: 1,
        any_all_flag: 'any',
        conflictOfInterestCheck: false,
        documentCount: 0,
        documents: [],
      });
      setRequireDocuments(false);
      setEditingStageIndex(null);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error updating stage:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
        requestData: stageData,
      });
      setError(`Failed to update stage: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleDeleteStage = async (index: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can delete stages.');
      return;
    }
    if (!stages[index]?.idwfd_stages) {
      setError('Invalid stage selected for deletion.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this stage?')) {
      const wfId = workflowId;
      if (!wfId) {
        setError('Workflow ID not found.');
        return;
      }

      try {
        setLoading(true);
        console.log('Sending DELETE /api/workflows/', wfId, '/stages/', stages[index].idwfd_stages);
        await axios.delete(`http://localhost:5000/api/workflows/${wfId}/stages/${stages[index].idwfd_stages}`);
        console.log('Stage deleted successfully');

        const updatedStages = stages.filter((_, i) => i !== index);
        updatedStages.forEach((stage, i) => stage.seq_no = i + 1);
        setStages(updatedStages);
        setLoading(false);
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Error deleting stage:', {
          message: error.message,
          response: error.response ? error.response.data : 'No response data',
          status: error.response ? error.response.status : 'No status',
        });
        setError(`Failed to delete stage: ${error.response?.data?.message || error.message || 'Network error'}`);
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can save workflows.');
      return;
    }
    console.log('Attempting to save workflow with:', {
      workflowId,
      workflowName,
      workflowDesc,
      workflowStatus,
      stages,
    });

    if (!validateStep1() || !validateStep2()) {
      console.log('Validation failed:', { workflowName, workflowDesc, stages });
      return;
    }

    try {
      setLoading(true);
      let response;
      if (workflowId) {
        console.log('Updating existing workflow:', workflowId);
        response = await axios.put<WorkflowResponse>(`http://localhost:5000/api/workflows/${workflowId}`, {
          wfd_name: workflowName,
          wfd_desc: workflowDesc,
          wfd_status: workflowStatus,
        });
      } else {
        console.log('Creating new workflow');
        response = await axios.post<WorkflowResponse>('http://localhost:5000/api/workflows', {
          wfd_name: workflowName,
          wfd_desc: workflowDesc,
          wfd_status: workflowStatus,
        });
        setWorkflowId(response.data.workflow_master_id || null); // Handle optional ID
      }

      const workflowData: Workflow = {
        ...response.data,
        stages: stages, // Ensure stages are included in the workflow data
      };
      console.log('Workflow saved successfully:', workflowData);
      onComplete(workflowData);
      navigate('/dashboard', { state: { userId: location.state?.userId, roles: userRoles } });
      setLoading(false);
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError(`Failed to save workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can proceed.');
      return;
    }
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setCurrentStep((prev) => (prev < 3 ? (prev + 1) as WizardStep : prev));
      setError(null);
    }
  };

  const handleDocumentCountChange = (count: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can modify document requirements.');
      return;
    }
    const newDocuments = Array(count).fill({ required: false });
    setCurrentStage({
      ...currentStage,
      documentCount: count,
      documents: newDocuments,
    });
  };

  const handleDocumentRequiredChange = (index: number, required: boolean) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can modify document requirements.');
      return;
    }
    const newDocuments = [...currentStage.documents];
    newDocuments[index] = { required };
    setCurrentStage({
      ...currentStage,
      documents: newDocuments,
    });
  };

  if (!canCreateWorkflow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only Workflow Designers can access this page. Please log in with the appropriate role or return to the dashboard.</p>
          <button
            onClick={() => {
              navigate('/dashboard');
              if (onCancel) onCancel();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Header with Cancel Button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {existingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
            {onCancel && (
              <button
                onClick={() => {
                  setError(null);
                  onCancel();
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  loading ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-300 text-purple-700 flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Loading...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`rounded-full h-10 w-10 flex items-center justify-center ${
                      step <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-1 w-24 ${
                        step < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Workflow Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Workflow Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className={inputStyles}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workflowDesc}
                  onChange={(e) => setWorkflowDesc(e.target.value)}
                  rows={4}
                  className={inputStyles}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={workflowStatus}
                  onChange={(e) => setWorkflowStatus(e.target.value as 'active' | 'inactive')}
                  className={inputStyles}
                  required
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Stage Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Stage Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={currentStage.name}
                    onChange={(e) => setCurrentStage({ ...currentStage, name: e.target.value })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={currentStage.description}
                    onChange={(e) => setCurrentStage({ ...currentStage, description: e.target.value })}
                    rows={3}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actor Type <span className="text-red-500">*</span></label>
                    <select
                      value={currentStage.actorType}
                      onChange={(e) => setCurrentStage({ ...currentStage, actorType: e.target.value as 'role' | 'user', actorName: '' })}
                      className={inputStyles}
                      required
                      disabled={loading}
                    >
                      <option value="role">Role</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actor Name <span className="text-red-500">*</span></label>
                    {currentStage.actorType === 'role' ? (
                      <select
                        value={currentStage.actorName}
                        onChange={(e) => setCurrentStage({ ...currentStage, actorName: e.target.value })}
                        className={inputStyles}
                        required
                        disabled={loading}
                      >
                        <option value="">Select a role</option>
                        {AVAILABLE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={currentStage.actorName}
                        onChange={(e) => setCurrentStage({ ...currentStage, actorName: e.target.value })}
                        className={inputStyles}
                        placeholder="Enter username"
                        required
                        disabled={loading}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actor Count <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={currentStage.actorCount}
                    onChange={(e) => setCurrentStage({ ...currentStage, actorCount: parseInt(e.target.value) || 1 })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Any/All Flag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentStage.any_all_flag}
                    onChange={(e) => setCurrentStage({ ...currentStage, any_all_flag: e.target.value as 'any' | 'all' })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  >
                    <option value="any">Any</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentStage.conflictOfInterestCheck}
                      onChange={(e) => setCurrentStage({ ...currentStage, conflictOfInterestCheck: e.target.checked })}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Enable Conflict of Interest Check</span>
                  </label>
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Document Requirements</h3>
                  <div>
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={requireDocuments}
                        onChange={(e) => {
                          setRequireDocuments(e.target.checked);
                          if (!e.target.checked) handleDocumentCountChange(0);
                        }}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">This stage requires documents</span>
                    </label>
                  </div>

                  {requireDocuments && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Number of Documents Required
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={currentStage.documentCount}
                          onChange={(e) => handleDocumentCountChange(parseInt(e.target.value) || 1)}
                          className={inputStyles}
                          disabled={loading}
                        />
                      </div>

                      {currentStage.documents.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">Document {index + 1}</span>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={doc.required}
                              onChange={(e) => handleDocumentRequiredChange(index, e.target.checked)}
                              className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                              disabled={loading}
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={editingStageIndex !== null ? handleUpdateStage : handleAddStage}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                  }`}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingStageIndex !== null ? 'Update Stage' : 'Add Stage'}
                </button>
              </div>

              {stages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Added Stages</h3>
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{stage.stage_name}</h4>
                            <p className="text-sm text-gray-600">{stage.stage_desc}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-500">Actor: {stage.actor_name} ({stage.actor_type})</p>
                              <p className="text-sm text-gray-500">Any/All: {stage.any_all_flag}</p>
                              <p className="text-sm text-gray-500">Conflict Check: {stage.conflict_check ? 'Yes' : 'No'}</p>
                              <p className="text-sm text-gray-500">Documents Required: {stage.no_of_uploads} ({stage.document_required ? 'Yes' : 'No'})</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditStage(index)}
                              className={`p-1 text-gray-500 hover:text-purple-600 transition-colors ${
                                loading ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                              title="Edit Stage"
                              disabled={loading}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStage(index)}
                              className={`p-1 text-gray-500 hover:text-red-600 transition-colors ${
                                loading ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                              title="Delete Stage"
                              disabled={loading}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Workflow Details</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowStatus === 'active' ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowDesc}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Stages ({stages.length})</h3>
                <div className="space-y-4">
                  {stages.map((stage, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium">{stage.stage_name}</h4>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Actor Type</dt>
                          <dd>{stage.actor_type}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Name</dt>
                          <dd>{stage.actor_name}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Count</dt>
                          <dd>{stage.actor_count}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Any/All</dt>
                          <dd>{stage.any_all_flag}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Conflict Check</dt>
                          <dd>{stage.conflict_check ? 'Yes' : 'No'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Documents Required</dt>
                          <dd>{stage.no_of_uploads} ({stage.document_required ? 'Yes' : 'No'})</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep((prev) => (prev - 1) as WizardStep);
                  setError(null);
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  loading ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={loading}
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                }`}
                disabled={loading}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                {existingWorkflow ? 'Update Workflow' : 'Save Workflow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowWizard;