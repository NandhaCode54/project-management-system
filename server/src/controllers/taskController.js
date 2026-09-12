const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
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
  await recordAudit({
    userId: req.user.id,
    action: 'TASK_CREATE',
    resource: 'TASK',
    resourceId: task.id,
    meta: { name: task.name, projectId: task.projectId },
    req,
  });
  res.status(201).json({
    success: true,
    message: 'Task created',
    data: toTaskWithProject(task),
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
  await recordAudit({
    userId: req.user.id,
    action: 'TASK_UPDATE',
    resource: 'TASK',
    resourceId: task.id,
    meta: { name: task.name, projectId: task.projectId },
    req,
  });
  res.json({
    success: true,
    message: 'Task updated',
    data: toTaskWithProject(task),
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.id, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: 'TASK_DELETE',
    resource: 'TASK',
    resourceId: req.params.id,
    meta: { name: task.name },
    req,
  });
  res.json({
    success: true,
    message: 'Task deleted',
    data: { id: req.params.id },
  });
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await taskService.completeTask(req.params.id, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: 'TASK_COMPLETE',
    resource: 'TASK',
    resourceId: task.id,
    meta: { name: task.name, projectId: task.projectId },
    req,
  });
  res.json({
    success: true,
    message: 'Task marked as completed',
    data: toTaskWithProject(task),
  });
});

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };