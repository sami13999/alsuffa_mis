const dashboardService = require('./dashboard.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class DashboardController {
  async getMetrics(req, res) {
    try {
      const role = req.user.role;
      let data = {};

      if (role === 'admin') {
        data = await dashboardService.getAdminStats();
      } else if (role === 'accountant') {
        data = await dashboardService.getAccountsStats();
      } else if (role === 'teacher') {
        data = await dashboardService.getTeacherStats(req.user.staffId);
      } else if (role === 'student') {
        data = await dashboardService.getStudentStats(req.user.studentId);
      }

      return successResponse(res, data, `${role} dashboard metrics loaded`);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new DashboardController();

