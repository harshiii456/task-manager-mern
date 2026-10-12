const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/memory');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, sort } = req.query;
    
    let query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }

    const tasks = await db.findTasks(query);
    
    // Sort tasks
    if (sort === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sort === 'dueDate') {
      tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error while fetching tasks' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await db.findTaskById(req.params.id);
    
    if (!task || task.user !== req.user._id) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error while fetching task' });
  }
});

// Create new task
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, dueDate } = req.body;

    const task = await db.createTask({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      user: req.user._id
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error while creating task' });
  }
});

// Update task
router.put('/:id', auth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const existingTask = await db.findTaskById(req.params.id);
    if (!existingTask || existingTask.user !== req.user._id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await db.updateTask(req.params.id, updates);

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error while updating task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const existingTask = await db.findTaskById(req.params.id);
    if (!existingTask || existingTask.user !== req.user._id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.deleteTask(req.params.id);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error while deleting task' });
  }
});

module.exports = router;
