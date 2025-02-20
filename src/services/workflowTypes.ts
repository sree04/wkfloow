export interface Stage {
    idwfd_stages: number;
    wf_id: number;
    seq_no: number;
    stage_name: string;
    stage_desc: string;
    stage_actor_id: number;
    actor_type: 'USER' | 'GROUP' | 'ROLE';
    actor_count: number;
    actor_name?: string;
  }
  
  export interface Workflow {
    workflow_master_id: number;
    wfd_name: string;
    wfd_desc: string;
    wfd_status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
    created_at: string;
    updated_at: string;
    stages?: Stage[];
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
  