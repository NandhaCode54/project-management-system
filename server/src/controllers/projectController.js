const projectService = require('../services/projectService');
const asyncHandler = require('../utils/asyncHandler');
const { toPublicProject, toPublicTask } = require('../utils/serializers');
const { paginate } = require('../utils/pagination');

const listProjects = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await projectService.listProjects(req.user.id, req.query);
  res.json({
    success: true,
    message: 'Projects retrieved',
    data: paginate(
      items.map((p) => ({ ...toPublicProject(p), taskCount: p._count.tasks })),
      page,
      limit,
      total,
    ),
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Project retrieved',
    data: {
      ...toPublicProject(project),
      tasks: project.tasks.map((t) => toPublicTask(t)),
    },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Project created',
    data: { ...toPublicProject(project), taskCount: project._count.tasks },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
  res.json({
    success: true,
    message: 'Project updated',
    data: { ...toPublicProject(project), taskCount: project._count.tasks },
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(req.params.id, req.user.id);
  res.json({
    success: true,
    message: 'Project deleted',
    data: { id: project.id, taskCount: project._count.tasks },
  });
});

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };