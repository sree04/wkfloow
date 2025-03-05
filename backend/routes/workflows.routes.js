const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

router.get('/workflows', async (req, res) => {
  try {
    console.log('Fetching workflows from database...');
    const [rows] = await db.query(
      'SELECT wm.workflow_master_id, wm.wfd_name, wm.wfd_desc, wm.wfd_status, ' +
      'ws.idwfd_stages, ws.wf_id, ws.seq_no, ws.prev_stage_id, ws.next_stage_id, ws.stage_name, ws.stage_desc, ws.no_of_uploads, ' +
      'ws.stage_actor_id, ws.actor_type, ws.actor_count, ws.any_all_flag, ws.conflict_check, ws.GC, ws.document_required, ws.actor_name ' +
      'FROM wfd_workflow_master wm ' +
      'LEFT JOIN wfd_stages ws ON wm.workflow_master_id = ws.wf_id ' +
      'ORDER BY wm.workflow_master_id, ws.seq_no'
    );

    const workflows = {};
    rows.forEach(row => {
      if (!workflows[row.workflow_master_id]) {
        workflows[row.workflow_master_id] = {
          workflow_master_id: row.workflow_master_id,
          wfd_name: row.wfd_name,
          wfd_desc: row.wfd_desc,
          wfd_status: row.wfd_status,
          stages: []
        };
      }
      if (row.idwfd_stages) { // Only add if there are stages
        workflows[row.workflow_master_id].stages.push({
          idwfd_stages: row.idwfd_stages,
          wf_id: row.wf_id,
          seq_no: row.seq_no,
          // Exclude new columns (prev_stage_id, next_stage_id, stage_actor_id, GC) from response
          stage_name: row.stage_name,
          stage_desc: row.stage_desc,
          no_of_uploads: row.no_of_uploads,
          actor_type: row.actor_type,
          actor_count: row.actor_count,
          any_all_flag: row.any_all_flag,
          conflict_check: row.conflict_check,
          document_required: row.document_required,
          actor_name: row.actor_name
        });
      }
    });

    const workflowList = Object.values(workflows);
    console.log('Workflows fetched:', workflowList);
    res.json(workflowList.length > 0 ? workflowList : []); // Return 200 with [] if no workflows
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
      'ws.idwfd_stages, ws.wf_id, ws.seq_no, ws.prev_stage_id, ws.next_stage_id, ws.stage_name, ws.stage_desc, ws.no_of_uploads, ' +
      'ws.stage_actor_id, ws.actor_type, ws.actor_count, ws.any_all_flag, ws.conflict_check, ws.GC, ws.document_required, ws.actor_name ' +
      'FROM wfd_workflow_master wm ' +
      'LEFT JOIN wfd_stages ws ON wm.workflow_master_id = ws.wf_id ' +
      'WHERE wm.workflow_master_id = ? ' +
      'ORDER BY ws.seq_no',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const workflow = {
      workflow_master_id: rows[0].workflow_master_id,
      wfd_name: rows[0].wfd_name,
      wfd_desc: rows[0].wfd_desc,
      wfd_status: rows[0].wfd_status,
      stages: []
    };

    rows.forEach(row => {
      if (row.idwfd_stages) {
        workflow.stages.push({
          idwfd_stages: row.idwfd_stages,
          wf_id: row.wf_id,
          seq_no: row.seq_no,
          // Exclude new columns (prev_stage_id, next_stage_id, stage_actor_id, GC) from response
          stage_name: row.stage_name,
          stage_desc: row.stage_desc,
          no_of_uploads: row.no_of_uploads,
          actor_type: row.actor_type,
          actor_count: row.actor_count,
          any_all_flag: row.any_all_flag,
          conflict_check: row.conflict_check,
          document_required: row.document_required,
          actor_name: row.actor_name
        });
      }
    });

    console.log('Workflow fetched:', workflow);
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error.message);
    res.status(500).json({ message: `Failed to fetch workflow: ${error.message}` });
  }
});

router.post('/workflows', async (req, res) => {
  const { wfd_name, wfd_desc, wfd_status } = req.body;
  try {
    console.log('Creating new workflow with:', { wfd_name, wfd_desc, wfd_status });
    const [result] = await db.query(
      'INSERT INTO wfd_workflow_master (wfd_name, wfd_desc, wfd_status) VALUES (?, ?, ?)',
      [wfd_name, wfd_desc, wfd_status]
    );
    res.json({ workflow_master_id: result.insertId, wfd_name, wfd_desc, wfd_status, stages: [] });
  } catch (error) {
    console.error('Error creating workflow:', error.message);
    res.status(500).json({ message: `Failed to create workflow: ${error.message}` });
  }
});

router.put('/workflows/:id', async (req, res) => {
  const { id } = req.params;
  const { wfd_name, wfd_desc, wfd_status } = req.body;
  try {
    console.log(`Updating workflow ${id} with:`, { wfd_name, wfd_desc, wfd_status });
    await db.query(
      'UPDATE wfd_workflow_master SET wfd_name = ?, wfd_desc = ?, wfd_status = ? WHERE workflow_master_id = ?',
      [wfd_name, wfd_desc, wfd_status, id]
    );
    res.json({ workflow_master_id: parseInt(id), wfd_name, wfd_desc, wfd_status, stages: [] });
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
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting workflow:', error.message);
    res.status(500).json({ message: `Failed to delete workflow: ${error.message}` });
  }
});

router.post('/workflows/:id/stages', async (req, res) => {
  const { id } = req.params;
  const { seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name } = req.body;
  try {
    console.log(`Adding stage to workflow ${id} with:`, { seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name });
    const [result] = await db.query(
      'INSERT INTO wfd_stages (wf_id, seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name]
    );
    res.json({
      idwfd_stages: result.insertId,
      wf_id: parseInt(id),
      seq_no,
      // Exclude new columns (prev_stage_id, next_stage_id, stage_actor_id) from response
      stage_name,
      stage_desc,
      no_of_uploads,
      actor_type,
      actor_count,
      any_all_flag,
      conflict_check,
      document_required,
      actor_name
    });
  } catch (error) {
    console.error('Error adding stage:', error.message);
    res.status(500).json({ message: `Failed to add stage: ${error.message}` });
  }
});

router.put('/workflows/:id/stages/:stageId', async (req, res) => {
  const { id, stageId } = req.params;
  const { seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name } = req.body;
  try {
    console.log(`Updating stage ${stageId} in workflow ${id} with:`, { seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name });
    await db.query(
      'UPDATE wfd_stages SET seq_no = ?, prev_stage_id = ?, next_stage_id = ?, stage_name = ?, stage_desc = ?, no_of_uploads = ?, stage_actor_id = ?, actor_type = ?, actor_count = ?, any_all_flag = ?, conflict_check = ?, document_required = ?, actor_name = ? WHERE idwfd_stages = ? AND wf_id = ?',
      [seq_no, prev_stage_id, next_stage_id, stage_name, stage_desc, no_of_uploads, stage_actor_id, actor_type, actor_count, any_all_flag, conflict_check, document_required, actor_name, stageId, id]
    );
    res.json({
      idwfd_stages: parseInt(stageId),
      wf_id: parseInt(id),
      seq_no,
      // Exclude new columns (prev_stage_id, next_stage_id, stage_actor_id) from response
      stage_name,
      stage_desc,
      no_of_uploads,
      actor_type,
      actor_count,
      any_all_flag,
      conflict_check,
      document_required,
      actor_name
    });
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
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting stage:', error.message);
    res.status(500).json({ message: `Failed to delete stage: ${error.message}` });
  }
});

module.exports = router;