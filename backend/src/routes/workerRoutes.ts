import express from 'express';
import {
  getWorkerProfile,
  getCurrentTask,
  getAssignedTasks,
  completeTask,
} from '../controllers/workerController';

const router = express.Router();

// Worker profile routes
router.get('/profile', getWorkerProfile);

// Task management routes
router.get('/current-task', getCurrentTask);
router.get('/tasks', getAssignedTasks);
router.post('/tasks/:taskId/complete', completeTask);

export default router; 