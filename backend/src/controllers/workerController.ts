import { Request, Response } from 'express';
import Worker from '../models/Worker';
import MechanicRequest from '../models/MechanicRequest';
import { verifyToken } from '../middleware/auth';

export const getWorkerProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const worker = await Worker.findById(decoded.userId)
      .populate('currentTask')
      .populate('completedTasks');

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    return res.json({ worker });
  } catch (error) {
    console.error('Error in getWorkerProfile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentTask = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const worker = await Worker.findById(decoded.userId)
      .populate('currentTask');

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    return res.json({ currentTask: worker.currentTask });
  } catch (error) {
    console.error('Error in getCurrentTask:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignedTasks = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const worker = await Worker.findById(decoded.userId)
      .populate('completedTasks');

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    return res.json({ tasks: worker.completedTasks });
  } catch (error) {
    console.error('Error in getAssignedTasks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { taskId } = req.params;
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    const worker = await Worker.findById(decoded.userId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (!worker.currentTask || worker.currentTask.toString() !== taskId) {
      return res.status(400).json({ error: 'This task is not currently assigned to the worker' });
    }

    const request = await MechanicRequest.findById(taskId);
    if (!request) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update request status
    request.status = 'Completed';
    await request.save();

    // Update worker status and tasks
    worker.currentStatus = 'available';
    worker.currentTask = null;
    worker.completedTasks.push(taskId);
    await worker.save();

    return res.json({ message: 'Task completed successfully' });
  } catch (error) {
    console.error('Error in completeTask:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 