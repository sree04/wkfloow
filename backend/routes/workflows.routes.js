const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// Get all workflows
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wfd_workflow_master');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const [workflow] = await db.query(
      'SELECT * FROM wfd_workflow_master WHERE workflow_master_id = ?',
      [req.params.id]
    );
    
    if (workflow.length === 0) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Get stages for this workflow
    const [stages] = await db.query(
      'SELECT * FROM wfd_stages WHERE wf_id = ? ORDER BY seq_no',
      [req.params.id]
    );

    res.json({
      ...workflow[0],
      stages: stages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new workflow
router.post('/', async (req, res) => {
  const { wfd_name, wfd_desc, wfd_status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO wfd_workflow_master (wfd_name, wfd_desc, wfd_status) VALUES (?, ?, ?)',
      [wfd_name, wfd_desc, wfd_status]
    );
    res.status(201).json({ 
      workflow_master_id: result.insertId, 
      wfd_name, 
      wfd_desc, 
      wfd_status 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add stage to workflow
router.post('/:id/stages', async (req, res) => {
  const { 
    seq_no, 
    stage_name, 
    stage_desc, 
    stage_actor_id, 
    actor_type,
    actor_count
  } = req.body;
  
  try {
    const [result] = await db.query(
      `INSERT INTO wfd_stages (
        wf_id, seq_no, stage_name, stage_desc, 
        stage_actor_id, actor_type, actor_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, seq_no, stage_name, stage_desc, 
       stage_actor_id, actor_type, actor_count]
    );
    res.status(201).json({ 
      idwfd_stages: result.insertId,
      wf_id: req.params.id,
      seq_no,
      stage_name,
      stage_desc
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;