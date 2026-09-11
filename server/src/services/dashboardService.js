const db = require('../config/db');

async function getStats(userId) {
  const projectWhere = { userId };
  const taskWhere = { project: { userId } };

  const [
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
    projectStatusDistribution,
    taskStatusDistribution,
    taskPriorityDistribution,
  ] = await Promise.all([
    db.project.count({ where: projectWhere }),
    db.task.count({ where: taskWhere }),
    db.task.count({ where: { project: { userId }, status: 'COMPLETED' } }),
    db.task.count({ where: { project: { userId }, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    db.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
    db.project.groupBy({ by: ['status'], where: projectWhere, _count: { _all: true } }),
    db.task.groupBy({ by: ['status'], where: taskWhere, _count: { _all: true } }),
    db.task.groupBy({ by: ['priority'], where: taskWhere, _count: { _all: true } }),
  ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
    distributions: {
      projectStatus: {
        NOT_STARTED: projectStatusDistribution.find((d) => d.status === 'NOT_STARTED')?._count._all ?? 0,
        IN_PROGRESS: projectStatusDistribution.find((d) => d.status === 'IN_PROGRESS')?._count._all ?? 0,
        COMPLETED: projectStatusDistribution.find((d) => d.status === 'COMPLETED')?._count._all ?? 0,
      },
      taskStatus: {
        PENDING: taskStatusDistribution.find((d) => d.status === 'PENDING')?._count._all ?? 0,
        IN_PROGRESS: taskStatusDistribution.find((d) => d.status === 'IN_PROGRESS')?._count._all ?? 0,
        COMPLETED: taskStatusDistribution.find((d) => d.status === 'COMPLETED')?._count._all ?? 0,
      },
      taskPriority: {
        LOW: taskPriorityDistribution.find((d) => d.priority === 'LOW')?._count._all ?? 0,
        MEDIUM: taskPriorityDistribution.find((d) => d.priority === 'MEDIUM')?._count._all ?? 0,
        HIGH: taskPriorityDistribution.find((d) => d.priority === 'HIGH')?._count._all ?? 0,
      },
    },
  };
}

module.exports = { getStats };