import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/workflowService';
import ApiService from '../services/api';
import { ArrowRight, Plus, Save, AlertCircle, X, ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface WorkflowWizardProps {
  onComplete: (workflow: any) => void;
  existingWorkflow?: any;
  onCancel?: () => void;
}

type Document = {
  required: boolean;
};

type Stage = {
  name: string;
  description: string;
  actorType: 'USER' | 'ROLE';
  actorName: string;
  actorCount: number;
  anyAllFlag: 'ANY' | 'ALL';
  conflictOfInterestCheck: boolean;
  documentCount: number;
  documents: Document[];
};

type WizardStep = 1 | 2 | 3;

const AVAILABLE_ROLES = [
  { value: 'designer', label: 'Workflow Designer' },
  { value: 'admin', label: 'System Administrator' },
  { value: 'reviewer', label: 'Content Reviewer' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'approver', label: 'Financial Approver' },
  { value: 'auditor', label: 'System Auditor' },
  { value: 'supervisor', label: 'Team Supervisor' },
  { value: 'coordinator', label: 'Process Coordinator' }
];

const inputStyles = "mt-1 block w-full rounded-md border-2 border-purple-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50";

const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ onComplete, existingWorkflow, onCancel }:WorkflowWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [workflowName, setWorkflowName] = useState(existingWorkflow?.name || '');
  const [workflowDesc, setWorkflowDesc] = useState(existingWorkflow?.description || '');
  const [workflowStatus, setWorkflowStatus] = useState<'Active' | 'Inactive'>(existingWorkflow?.status || 'Active');
  const [isLoading, setIsLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>(existingWorkflow?.stages || []);
  const [currentStage, setCurrentStage] = useState<Stage>({
    name: '',
    description: '',
    actorType: 'USER',
    actorName: '',
    actorCount: 1,
    anyAllFlag: 'ANY',
    conflictOfInterestCheck: false,
    documentCount: 0,
    documents: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [requireDocuments, setRequireDocuments] = useState(false);
  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name);
      setWorkflowDesc(existingWorkflow.description);
      setWorkflowStatus(existingWorkflow.status);
      setStages(existingWorkflow.stages);
    }
  }, [existingWorkflow]);

  const validateStep1 = () => {
    if (!workflowName.trim()) {
      setError('Workflow name is required');
      return false;
    }
    if (!workflowDesc.trim()) {
      setError('Workflow description is required');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (stages.length === 0) {
      setError('At least one stage is required');
      return false;
    }
    setError('');
    return true;
  };

  const validateCurrentStage = () => {
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
    setError('');
    return true;
  };

  const handleDocumentCountChange = (count: number) => {
    const newDocuments: Document[] = Array(count).fill({ required: false });
    setCurrentStage({
      ...currentStage,
      documentCount: count,
      documents: newDocuments
    });
  };

  const handleDocumentRequiredChange = (index: number, required: boolean) => {
    const newDocuments = [...currentStage.documents];
    newDocuments[index] = { required };
    setCurrentStage({
      ...currentStage,
      documents: newDocuments
    });
  };

  const handleEditStage = (index: number) => {
    setEditingStageIndex(index);
    setCurrentStage(stages[index]);
    setRequireDocuments(stages[index].documentCount > 0);
  };

  const handleDeleteStage = (index: number) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      const newStages = stages.filter((_, i) => i !== index);
      setStages(newStages);
    }
  };

  const handleAddStage = () => {
    if (validateCurrentStage()) {
      if (editingStageIndex !== null) {
        const newStages = [...stages];
        newStages[editingStageIndex] = currentStage;
        setStages(newStages);
        setEditingStageIndex(null);
      } else {
        setStages([...stages, currentStage]);
      }
      setCurrentStage({
        name: '',
        description: '',
        actorType: 'USER',
        actorName: '',
        actorCount: 1,
        anyAllFlag: 'ANY',
        conflictOfInterestCheck: false,
        documentCount: 0,
        documents: [],
      });
      setRequireDocuments(false);
      setError('');
    }
  };

  const handleNextStep = () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setCurrentStep((prev) => (prev < 3 ? (prev + 1) as WizardStep : prev));
      setError('');
    }
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    const workflowData = {
      name: workflowName,
      description: workflowDesc,
      status: workflowStatus,
      stages: stages
    };
    //   let result;
    //   if (existingWorkflow) {
    //     result = await workflowService.updateWorkflow(
    //       existingWorkflow.workflow_master_id, 
    //       workflowData
    //     );
    //   } else {
    //     result = await workflowService.createWorkflow(workflowData);
    //   }
  
    //   onComplete(result);
    // } catch (error: any) {
    //   setError(error.message || 'Failed to save workflow');
    // }
    // finally {
    //   setIsLoading(false);
    // }
    try {
      let workflow;
      if (existingWorkflow) {
        workflow = await ApiService.updateWorkflow(existingWorkflow.id, workflowData);
      } else {
        workflow = await ApiService.createWorkflow(workflowData);
      }
      onComplete(workflow);
    } catch (error) {
      setError('Failed to save workflow. Please try again.');
    }
  };
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
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>

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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={workflowStatus}
                  onChange={(e) => setWorkflowStatus(e.target.value as 'Active' | 'Inactive')}
                  className={inputStyles}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                 
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
                  <label className="block text-sm font-medium text-gray-700">
                    Stage Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentStage.name}
                    onChange={(e) => setCurrentStage({ ...currentStage, name: e.target.value })}
                    className={inputStyles}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stage Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={currentStage.description}
                    onChange={(e) => setCurrentStage({ ...currentStage, description: e.target.value })}
                    rows={3}
                    className={inputStyles}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Actor Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentStage.actorType}
                      onChange={(e) => {
                        setCurrentStage({ 
                          ...currentStage, 
                          actorType: e.target.value as 'USER' | 'ROLE',
                          actorName: '' // Reset actor name when type changes
                        });
                      }}
                      className={inputStyles}
                      required
                    >
                      <option value="USER">User</option>
                      <option value="ROLE">Role</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Actor Name <span className="text-red-500">*</span>
                    </label>
                    {currentStage.actorType === 'ROLE' ? (
                      <select
                        value={currentStage.actorName}
                        onChange={(e) => setCurrentStage({ ...currentStage, actorName: e.target.value })}
                        className={inputStyles}
                        required
                      >
                        <option value="">Select a role</option>
                        {AVAILABLE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
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
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Actor Count <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentStage.actorCount}
                      onChange={(e) => setCurrentStage({ ...currentStage, actorCount: parseInt(e.target.value) })}
                      className={inputStyles}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Any/All Flag <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentStage.anyAllFlag}
                      onChange={(e) => setCurrentStage({ ...currentStage, anyAllFlag: e.target.value as 'ANY' | 'ALL' })}
                      className={inputStyles}
                      required
                    >
                      <option value="ANY">Any</option>
                      <option value="ALL">All</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentStage.conflictOfInterestCheck}
                      onChange={(e) => setCurrentStage({ ...currentStage, conflictOfInterestCheck: e.target.checked })}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Enable Conflict of Interest Check</span>
                  </label>
                </div>

                {/* Document Requirements Section */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Document Requirements</h3>
                  <div>
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={requireDocuments}
                        onChange={(e) => {
                          setRequireDocuments(e.target.checked);
                          if (!e.target.checked) {
                            handleDocumentCountChange(0);
                          }
                        }}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
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
                          onChange={(e) => handleDocumentCountChange(parseInt(e.target.value))}
                          className={inputStyles}
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
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                           font-medium rounded-md shadow-sm text-white bg-purple-600 
                           hover:bg-purple-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-purple-500"
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
                            <h4 className="font-medium">{stage.name}</h4>
                            <p className="text-sm text-gray-600">{stage.description}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-500">
                                Actor: {stage.actorType === 'ROLE' ? 
                                  AVAILABLE_ROLES.find(role => role.value === stage.actorName)?.label : 
                                  stage.actorName}
                              </p>
                              {stage.documentCount > 0 && (
                                <p className="text-sm text-gray-500">
                                  Documents Required: {stage.documentCount}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditStage(index)}
                              className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                              title="Edit Stage"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStage(index)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete Stage"
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
                    <dd className="mt-1 text-sm text-gray-900">{workflowStatus}</dd>
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
                      <h4 className="font-medium">{stage.name}</h4>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Actor Type</dt>
                          <dd>{stage.actorType}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Name</dt>
                          <dd>{stage.actorType === 'ROLE' ? 
                            AVAILABLE_ROLES.find(role => role.value === stage.actorName)?.label : 
                            stage.actorName}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Count</dt>
                          <dd>{stage.actorCount}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Any/All</dt>
                          <dd>{stage.anyAllFlag}</dd>
                        </div>
                        {stage.documentCount > 0 && (
                          <div className="col-span-2">
                            <dt className="text-gray-500">Documents Required</dt>
                            <dd>
                              {stage.documentCount} document{stage.documentCount !== 1 ? 's' : ''} 
                              {stage.documents.filter(d => d.required).length > 0 && (
                                ` (${stage.documents.filter(d => d.required).length} required)`
                              )}
                            </dd>
                          </div>
                        )}
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
                  setCurrentStep((prev) => (prev > 1 ? (prev - 1) as WizardStep : prev));
                  setError('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm 
                         text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent 
                         text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 
                         hover:bg-purple-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-purple-500"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              
              className="inline-flex items-center px-4 py-2 border border-transparent 
                       text-sm font-medium rounded-md shadow-sm text-white bg-green-600 
                       hover:bg-green-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-green-500"
            >
              {isLoading ? (
                <>
                  <span className="spinner mr-2" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingWorkflow ? 'Update Workflow' : 'Save Workflow'}
                </>
              )}
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowWizard;
