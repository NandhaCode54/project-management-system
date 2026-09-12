const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { toPublicUser, toPublicAuditLog } = require('../utils/serializers');
const { paginate } = require('../utils/pagination');

const listUsers = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listUsers(req.query);
  res.json({
    success: true,
    message: 'Users retrieved',
    data: paginate(items.map(toPublicUser), page, limit, total),
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body.role, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: 'USER_ROLE_CHANGED',
    resource: 'USER',
    resourceId: user.id,
    meta: { role: user.role, targetEmail: user.email },
    req,
  });
  res.json({
    success: true,
    message: 'User role updated',
    data: toPublicUser(user),
  });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listAuditLogs(req.query);
  res.json({
    success: true,
    message: 'Audit logs retrieved',
    data: paginate(items.map(toPublicAuditLog), page, limit, total),
  });
});

module.exports = { listUsers, updateRole, listAuditLogs };