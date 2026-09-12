const db = require('../config/db');
const logger = require('../config/logger');

async function recordAudit({ userId = null, action, resource, resourceId = null, meta, req = null }) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        meta: meta ?? undefined,
        ip: req?.ip ?? null,
        userAgent: req?.ip ? req.get('user-agent') ?? null : null,
      },
    });
  } catch (err) {
    logger.error({ err, action, resource }, 'Failed to write audit log');
  }
}

module.exports = { recordAudit };