const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');
const { toTaskWithProject } = require('../utils/serializers');
const { paginate } = require('../utils/pagination');

const listTasks = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await taskService.listTasks(req.user.id, req.query);
  res.json({
    success: true,
    message: 'Tasks retrieved',
    data: paginate(items.map(toTaskWithProject), page, limit, total),
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Task retrieved',
    data: toTaskWithProject(task),
  });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Task created',
    data: toTaskWithProject(task),
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
  res.json({
    success: true,
    message: 'Task updated',
    data: toTaskWithProject(task),
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Task deleted',
    data: { id: task.id },
  });
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await taskService.completeTask(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Task marked as completed',
    data: toTaskWithProject(task),
  });
});

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };