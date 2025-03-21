// Define the WorkflowResponse interface with camelCase to match the backend response
export interface WorkflowResponse {
    workflowMasterId?: number;
    wfdName: string;
    wfdDesc: string;
    wfdStatus: 'active' | 'inactive';
  }
  
  // Define the Stage interface
  export interface Stage {
    idwfdStages?: number;
    wfId?: number;
    seqNo: number;
    stageName: string;
    stageDesc: string;
    noOfUploads: number;
    actorType: 'role' | 'user';
    actorCount: number;
    anyAllFlag: 'any' | 'all';
    conflictCheck: number;
    documentRequired: number;
    actorName: string;
    actions?: Action[];
  }
  
  // Define the Action interface (based on the backend response in workflowRoutes.js)
  export interface Action {
    idwfdStagesActions?: number;
    stageId: number;
    actionName: string;
    actionDesc?: string | null;
    actorId?: number | null;
    nextStageType: string;
    nextStageId?: number | null;
    requiredCount: number;
  }
  
  // Define the Workflow interface
  export interface Workflow extends WorkflowResponse {
    stages: Stage[];
  }