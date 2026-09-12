const express = require('express');

const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/common');
const { updateRoleSchema, adminQuerySchema, auditLogQuerySchema } = require('../validators/admin');

const router = express.Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/users', validate.query(adminQuerySchema), adminController.listUsers);
router.patch('/users/:id/role', validate.params(idParamSchema), validate.body(updateRoleSchema), adminController.updateRole);
router.get('/audit-logs', validate.query(auditLogQuerySchema), adminController.listAuditLogs);

module.exports = router;