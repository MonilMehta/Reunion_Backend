import express from 'express';
import Task from '../models/Task.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new task
router.post('/', verifyToken, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      userId: req.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all tasks for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a task
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    console.log(updatedTask);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
router.get('/statistics', verifyToken, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ userId: req.userId });
    const completedTasks = await Task.countDocuments({ userId: req.userId, status: 'finished' });
    const pendingTasks = totalTasks - completedTasks;

    const completedTasksData = await Task.find({ userId: req.userId, status: 'finished' });
    const totalCompletionTime = completedTasksData.reduce((sum, task) => {
      return sum + (task.endTime - task.startTime) / (1000 * 60 * 60); // in hours
    }, 0);

    const averageCompletionTime = completedTasksData.length > 0 ? totalCompletionTime / completedTasksData.length : 0;

    res.json({
      totalTasks,
      percentCompleted: (completedTasks / totalTasks) * 100,
      percentPending: (pendingTasks / totalTasks) * 100,
      averageCompletionTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending tasks statistics
router.get('/pending-tasks', verifyToken, async (req, res) => {
  try {
    const pendingTasksData = await Task.find({ userId: req.userId, status: 'pending' });

    const currentTime = new Date();
    let totalTimeLapsed = 0;
    let totalTimeToEnd = 0;

    pendingTasksData.forEach(task => {
      const timeLapsed = (currentTime - task.startTime) / (1000 * 60 * 60); // in hours
      const timeToEnd = (task.endTime - task.startTime) / (1000 * 60 * 60); // in hours

      totalTimeLapsed += timeLapsed;
      totalTimeToEnd += timeToEnd;
    });

    res.json({
      totalPendingTasks: pendingTasksData.length,
      totalTimeLapsed,
      totalTimeToEnd
    });
  } catch (error) {
    res.status500().json({ error: error.message });
  }
});

// Get priority-wise pending tasks statistics
router.get('/priority-pending-tasks', verifyToken, async (req, res) => {
  try {
    const pendingTasksData = await Task.find({ userId: req.userId, status: 'pending' });

    const currentTime = new Date();
    let timeLapsedByPriority = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    let timeToFinishByPriority = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

    pendingTasksData.forEach(task => {
      const timeLapsed = (currentTime - task.startTime) / (1000 * 60 * 60); // in hours
      const timeToFinish = (task.endTime - currentTime) / (1000 * 60 * 60); // in hours

      timeLapsedByPriority[task.priority] += timeLapsed;
      timeToFinishByPriority[task.priority] += timeToFinish;
    });

    res.json({
      timeLapsedByPriority,
      timeToFinishByPriority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;