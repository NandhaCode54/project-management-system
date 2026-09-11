const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.id);
  res.json({
    success: true,
    message: 'Dashboard statistics retrieved',
    data: stats,
  });
});

module.exports = { getStats };