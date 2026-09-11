const db = require('../config/db');
const { notFound } = require('../utils/httpErrors');
const { parsePagination } = require('../utils/pagination');

function orderDirective(sortBy, order) {
  return { [sortBy]: order };
}

async function listProjects(userId, query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    userId,
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: orderDirective(query.sortBy, query.order),
      skip,
      take: limit,
      include: { _count: { select: { tasks: true } } },
    }),
    db.project.count({ where }),
  ]);

  return { items, page, limit, total };
}

async function getProject(id, userId) {
  const project = await db.project.findFirst({
    where: { id, userId },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  });

  if (!project) {
    throw notFound('Project not found');
  }
  return project;
}

async function createProject(userId, data) {
  return db.project.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? 'NOT_STARTED',
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { _count: { select: { tasks: true } } },
  });
}

async function assertProjectOwnership(id, userId) {
  const project = await db.project.findFirst({ where: { id, userId }, select: { id: true } });
  if (!project) {
    throw notFound('Project not found');
  }
  return project.id;
}

async function updateProject(id, userId, data) {
  await assertProjectOwnership(id, userId);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

  return db.project.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { tasks: true } } },
  });
}

async function deleteProject(id, userId) {
  await assertProjectOwnership(id, userId);

  // Tasks are removed automatically via onDelete: Cascade.
  return db.project.delete({ where: { id }, include: { _count: { select: { tasks: true } } } });
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  assertProjectOwnership,
  updateProject,
  deleteProject,
};