const db = require('../config/db');
const { parsePagination } = require('../utils/pagination');
const { notFound, badRequest } = require('../utils/httpErrors');

const userSelect = { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true };

async function listUsers(query) {
  const { page, limit, skip } = parsePagination(query);

  const where = query.search
    ? {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return { items, page, limit, total };
}

async function updateUserRole(id, role, actorId) {
  if (id === actorId) {
    throw badRequest('You cannot change your own role');
  }

  const existing = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw notFound('User not found');
  }

  return db.user.update({ where: { id }, data: { role }, select: userSelect });
}

async function listAuditLogs(query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.resource ? { resource: query.resource } : {}),
  };

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  return { items, page, limit, total };
}

module.exports = { listUsers, updateUserRole, listAuditLogs };