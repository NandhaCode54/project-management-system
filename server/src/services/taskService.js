const db = require('../config/db');
const projectService = require('./projectService');
const { notFound } = require('../utils/httpErrors');
const { parsePagination } = require('../utils/pagination');

function orderDirective(sortBy, order) {
  return { [sortBy]: order };
}

async function listTasks(userId, query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    project: {
      userId,
      ...(query.projectId ? { id: query.projectId } : {}),
    },
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const [items, total] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: orderDirective(query.sortBy, query.order),
      skip,
      take: limit,
      include: { project: { select: { id: true, name: true, status: true } } },
    }),
    db.task.count({ where }),
  ]);

  return { items, page, limit, total };
}

async function getTask(id, userId) {
  const task = await db.task.findFirst({
    where: { id, project: { userId } },
    include: { project: { select: { id: true, name: true, status: true } } },
  });

  if (!task) {
    throw notFound('Task not found');
  }
  return task;
}

async function assertTaskOwnership(id, userId) {
  const task = await db.task.findFirst({
    where: { id, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!task) {
    throw notFound('Task not found');
  }
  return task;
}

async function createTask(userId, data) {
  await projectService.assertProjectOwnership(data.projectId, userId);

  return db.task.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      status: data.status ?? 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: { project: { select: { id: true, name: true, status: true } } },
  });
}

async function updateTask(id, userId, data) {
  await assertTaskOwnership(id, userId);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  return db.task.update({
    where: { id },
    data: updateData,
    include: { project: { select: { id: true, name: true, status: true } } },
  });
}

async function deleteTask(id, userId) {
  await assertTaskOwnership(id, userId);
  return db.task.delete({ where: { id } });
}

async function completeTask(id, userId) {
  await assertTaskOwnership(id, userId);
  return db.task.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: { project: { select: { id: true, name: true, status: true } } },
  });
}

module.exports = {
  listTasks,
  getTask,
  assertTaskOwnership,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
};