function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toPublicAuditLog(log) {
  if (!log) return null;
  return {
    id: log.id,
    userId: log.userId,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    meta: log.meta,
    ip: log.ip,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
    user: log.user ? { id: log.user.id, fullName: log.user.fullName, email: log.user.email } : null,
  };
}

function toPublicProject(project) {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function toPublicTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    projectId: task.projectId,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function toTaskWithProject(task) {
  const base = toPublicTask(task);
  if (!base) return null;
  return {
    ...base,
    project: task.project ? { id: task.project.id, name: task.project.name, status: task.project.status } : null,
  };
}

module.exports = { toPublicUser, toPublicAuditLog, toPublicProject, toPublicTask, toTaskWithProject };