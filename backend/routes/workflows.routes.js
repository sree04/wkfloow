const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// Utility function to convert snake_case to camelCase
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

// Transform object keys from snake_case to camelCase
const transformToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => transformToCamelCase(item));
  }
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const transformed = {};
  for (const key in obj) {
    const camelKey = snakeToCamel(key);
    transformed[camelKey] = transformToCamelCase(obj[key]);
  }
  return transformed;
};

router.get('/workflows', async (req, res) => {
  try {
    console.log('Fetching all workflows from database...');
    const [rows] = await db.query(
      'SELECT wm.workflow_master_id, wm.wfd_name, wm.wfd_desc, wm.wfd_status, ' +
      'ws.idwfd_stages, ws.wf_id, ws.seq_no, ws.stage_name, ws.stage_desc, ws.no_of_uploads, ' +
      'ws.stage_actor_id, ws.actor_type, ws.actor_count, ws.any_all_flag, ws.conflict_check, ws.document_required, ws.actor_name ' +
      'FROM wfd_workflow_master wm ' +
      'LEFT JOIN wfd_stages ws ON wm.workflow_master_id = ws.wf_id ' +
      'ORDER BY wm.workflow_master_id, ws.seq_no'
    );

    const workflows = {};
    for (const row of rows) {
      if (!workflows[row.workflow_master_id]) {
        workflows[row.workflow_master_id] = {
          workflowMasterId: row.workflow_master_id,
          wfdName: row.wfd_name,
          wfdDesc: row.wfd_desc,
          wfdStatus: row.wfd_status,
          stages: [],
        };
      }
      if (row.idwfd_stages) {
        console.log(`Fetching actions for stage ${row.idwfd_stages} in workflow ${row.workflow_master_id}`);
        const [actions] = await db.query(
          'SELECT idwfd_stages_actions, stage_id, action_name, action_desc, actor_id, next_stage_type, next_stage_id, required_count ' +
          'FROM wfd_stages_actions WHERE stage_id = ?',
          [row.idwfd_stages]
        );
        const transformedActions = actions.map(action => transformToCamelCase(action));
        workflows[row.workflow_master_id].stages.push({
          idwfdStages: row.idwfd_stages,
          wfId: row.wf_id,
          seqNo: row.seq_no,
          stageName: row.stage_name,
          stageDesc: row.stage_desc,
          noOfUploads: row.no_of_uploads,
          actorType: row.actor_type,
          actorCount: row.actor_count,
          anyAllFlag: row.any_all_flag,
          conflictCheck: row.conflict_check,
          documentRequired: row.document_required,
          actorName: row.actor_name,
          actions: transformedActions,
        });
      }
    }

    const workflowList = Object.values(workflows);
    console.log('Workflows fetched successfully:', workflowList);
    res.json(workflowList.length > 0 ? workflowList : []);
  } catch (error) {
    console.error('Error fetching workflows:', error.message);
    res.status(500).json({ message: `Failed to fetch workflows: ${error.message}` });
  }
});

router.get('/workflows/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Fetching workflow with ID: ${id}`);
    const [rows] = await db.query(
      'SELECT wm.workflow_master_id, wm.wfd_name, wm.wfd_desc, wm.wfd_status, ' +
      'ws.idwfd_stages, ws.wf_id, ws.seq_no, ws.stage_name, ws.stage_desc, ws.no_of_uploads, ' +
      'ws.stage_actor_id, ws.actor_type, ws.actor_count, ws.any_all_flag, ws.conflict_check, ws.document_required, ws.actor_name ' +
      'FROM wfd_workflow_master wm ' +
      'LEFT JOIN wfd_stages ws ON wm.workflow_master_id = ws.wf_id ' +
      'WHERE wm.workflow_master_id = ? ' +
      'ORDER BY ws.seq_no',
      [id]
    );

    if (rows.length === 0) {
      console.log(`Workflow with ID ${id} not found`);
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const workflow = {
      workflowMasterId: rows[0].workflow_master_id,
      wfdName: rows[0].wfd_name,
      wfdDesc: rows[0].wfd_desc,
      wfdStatus: rows[0].wfd_status,
      stages: [],
    };

    for (const row of rows) {
      if (row.idwfd_stages) {
        console.log(`Fetching actions for stage ${row.idwfd_stages}`);
        const [actions] = await db.query(
          'SELECT idwfd_stages_actions, stage_id, action_name, action_desc, actor_id, next_stage_type, next_stage_id, required_count ' +
          'FROM wfd_stages_actions WHERE stage_id = ?',
          [row.idwfd_stages]
        );
        const transformedActions = actions.map(action => transformToCamelCase(action));
        workflow.stages.push({
          idwfdStages: row.idwfd_stages,
          wfId: row.wf_id,
          seqNo: row.seq_no,
          stageName: row.stage_name,
          stageDesc: row.stage_desc,
          noOfUploads: row.no_of_uploads,
          actorType: row.actor_type,
          actorCount: row.actor_count,
          anyAllFlag: row.any_all_flag,
          conflictCheck: row.conflict_check,
          documentRequired: row.document_required,
          actorName: row.actor_name,
          actions: transformedActions,
        });
      }
    }

    console.log('Workflow fetched successfully:', workflow);
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error.message);
    res.status(500).json({ message: `Failed to fetch workflow: ${error.message}` });
  }
});

router.post('/workflows', async (req, res) => {
  const { wfdName, wfdDesc, wfdStatus } = req.body;
  try {
    // Validate wfdStatus
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(wfdStatus)) {
      console.log(`Invalid wfdStatus value: ${wfdStatus}. Expected one of: ${validStatuses.join(', ')}`);
      return res.status(400).json({ message: `Invalid wfdStatus value: ${wfdStatus}. Expected one of: ${validStatuses.join(', ')}` });
    }

    console.log('Creating new workflow with:', { wfdName, wfdDesc, wfdStatus });
    const [result] = await db.query(
      'INSERT INTO wfd_workflow_master (wfd_name, wfd_desc, wfd_status) VALUES (?, ?, ?)',
      [wfdName, wfdDesc, wfdStatus]
    );
    const newWorkflow = {
      workflowMasterId: result.insertId,
      wfdName,
      wfdDesc,
      wfdStatus,
      stages: [],
    };
    console.log('New workflow created:', newWorkflow);
    res.json(newWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error.message);
    res.status(500).json({ message: `Failed to create workflow: ${error.message}` });
  }
});

router.put('/workflows/:id', async (req, res) => {
  const { id } = req.params;
  const { wfdName, wfdDesc, wfdStatus } = req.body;
  try {
    // Validate wfdStatus
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(wfdStatus)) {
      console.log(`Invalid wfdStatus value: ${wfdStatus}. Expected one of: ${validStatuses.join(', ')}`);
      return res.status(400).json({ message: `Invalid wfdStatus value: ${wfdStatus}. Expected one of: ${validStatuses.join(', ')}` });
    }

    console.log(`Updating workflow ${id} with:`, { wfdName, wfdDesc, wfdStatus });
    await db.query(
      'UPDATE wfd_workflow_master SET wfd_name = ?, wfd_desc = ?, wfd_status = ? WHERE workflow_master_id = ?',
      [wfdName, wfdDesc, wfdStatus, id]
    );
    const updatedWorkflow = {
      workflowMasterId: parseInt(id),
      wfdName,
      wfdDesc,
      wfdStatus,
      stages: [],
    };
    console.log('Workflow updated successfully:', updatedWorkflow);
    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error updating workflow:', error.message);
    res.status(500).json({ message: `Failed to update workflow: ${error.message}` });
  }
});

router.delete('/workflows/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Deleting workflow with ID: ${id}`);
    await db.query('DELETE FROM wfd_stages WHERE wf_id = ?', [id]);
    await db.query('DELETE FROM wfd_workflow_master WHERE workflow_master_id = ?', [id]);
    console.log(`Workflow ${id} deleted successfully`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error.message);
    res.status(500).json({ message: `Failed to delete workflow: ${error.message}` });
  }
});

router.post('/workflows/:id/stages', async (req, res) => {
  const { id } = req.params;
  const { seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName, actions } = req.body;
  try {
    console.log(`Adding stage to workflow ${id} with:`, { seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName, actions });
    const [result] = await db.query(
      'INSERT INTO wfd_stages (wf_id, seq_no, stage_name, stage_desc, no_of_uploads, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName]
    );
    const stageId = result.insertId;
    console.log(`Stage created with ID: ${stageId}`);

    let transformedActions = [];
    if (actions && Array.isArray(actions)) {
      console.log('Inserting actions for stage:', stageId);
      const actionQueries = actions.map(action => {
        console.log('Inserting action:', action);
        return db.query(
          'INSERT INTO wfd_stages_actions (stage_id, action_name, action_desc, actor_id, next_stage_type, next_stage_id, required_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [stageId, action.action_name, action.action_desc || null, action.actor_id || null, action.next_stage_type, action.next_stage_id || null, action.required_count || 1]
        );
      });
      await Promise.all(actionQueries);

      transformedActions = actions.map(action => ({
        idwfdStagesActions: null,
        stageId: stageId,
        actionName: action.action_name,
        actionDesc: action.action_desc || null,
        actorId: action.actor_id || null,
        nextStageType: action.next_stage_type,
        nextStageId: action.next_stage_id || null,
        requiredCount: action.required_count || 1,
      }));
      console.log('Transformed actions for response:', transformedActions);
    }

    const response = {
      idwfdStages: stageId,
      wfId: parseInt(id),
      seqNo,
      stageName,
      stageDesc,
      noOfUploads,
      actorType,
      actorCount,
      anyAllFlag,
      conflictCheck,
      documentRequired,
      actorName,
      actions: transformedActions,
    };
    console.log('Stage added successfully, sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error adding stage:', error.message);
    res.status(500).json({ message: `Failed to add stage: ${error.message}` });
  }
});

router.put('/workflows/:id/stages/:stageId', async (req, res) => {
  const { id, stageId } = req.params;
  const { seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName, actions } = req.body;
  try {
    console.log(`Updating stage ${stageId} in workflow ${id} with:`, { seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName, actions });
    await db.query(
      'UPDATE wfd_stages SET seq_no = ?, stage_name = ?, stage_desc = ?, no_of_uploads = ?, actor_type = ?, actor_count = ?, any_all_flag = ?, conflict_check = ?, document_required = ?, actor_name = ? WHERE idwfd_stages = ? AND wf_id = ?',
      [seqNo, stageName, stageDesc, noOfUploads, actorType, actorCount, anyAllFlag, conflictCheck, documentRequired, actorName, stageId, id]
    );

    console.log('Deleting existing actions for stage:', stageId);
    await db.query('DELETE FROM wfd_stages_actions WHERE stage_id = ?', [stageId]);

    let transformedActions = [];
    if (actions && Array.isArray(actions)) {
      console.log('Inserting updated actions for stage:', stageId);
      const actionQueries = actions.map(action => {
        console.log('Inserting updated action:', action);
        return db.query(
          'INSERT INTO wfd_stages_actions (stage_id, action_name, action_desc, actor_id, next_stage_type, next_stage_id, required_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [stageId, action.action_name, action.action_desc || null, action.actor_id || null, action.next_stage_type, action.next_stage_id || null, action.required_count || 1]
        );
      });
      await Promise.all(actionQueries);

      transformedActions = actions.map(action => ({
        idwfdStagesActions: null,
        stageId: parseInt(stageId),
        actionName: action.action_name,
        actionDesc: action.action_desc || null,
        actorId: action.actor_id || null,
        nextStageType: action.next_stage_type,
        nextStageId: action.next_stage_id || null,
        requiredCount: action.required_count || 1,
      }));
      console.log('Transformed updated actions for response:', transformedActions);
    }

    const response = {
      idwfdStages: parseInt(stageId),
      wfId: parseInt(id),
      seqNo,
      stageName,
      stageDesc,
      noOfUploads,
      actorType,
      actorCount,
      anyAllFlag,
      conflictCheck,
      documentRequired,
      actorName,
      actions: transformedActions,
    };
    console.log('Stage updated successfully, sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error updating stage:', error.message);
    res.status(500).json({ message: `Failed to update stage: ${error.message}` });
  }
});

router.delete('/workflows/:id/stages/:stageId', async (req, res) => {
  const { id, stageId } = req.params;
  try {
    console.log(`Deleting stage ${stageId} from workflow ${id}`);
    await db.query('DELETE FROM wfd_stages WHERE idwfd_stages = ? AND wf_id = ?', [stageId, id]);
    console.log(`Stage ${stageId} deleted successfully`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stage:', error.message);
    res.status(500).json({ message: `Failed to delete stage: ${error.message}` });
  }
});

module.exports = router;