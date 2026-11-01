const staffService = require('./staff.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class StaffController {
  async registerStaff(req, res) {
    try {
      const data = await staffService.registerStaff(req.body);
      return successResponse(res, data, 'Staff member registered successfully', 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getStaffList(req, res) {
    try {
      const filters = {
        role: req.query.role || null,
        search: req.query.search || null
      };
      const data = await staffService.getStaffList(filters);
      return successResponse(res, data, 'Staff list retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getStaffById(req, res) {
    try {
      const { id } = req.params;
      const data = await staffService.getStaffById(id);
      return successResponse(res, data, 'Staff details retrieved');
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async generatePayroll(req, res) {
    try {
      const { monthYear } = req.body;
      if (!monthYear) {
        return errorResponse(res, 'monthYear (YYYY-MM) is required', 400);
      }
      const data = await staffService.generateMonthlyPayroll(monthYear);
      return successResponse(res, data, `Monthly payroll for ${monthYear} processed`);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getPayrollRecords(req, res) {
    try {
      const filters = {
        monthYear: req.query.monthYear || null,
        status: req.query.status || null
      };
      const data = await staffService.getPayrollRecords(filters);
      return successResponse(res, data, 'Payroll records retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async disbursePayroll(req, res) {
    try {
      const { id } = req.params;
      const data = await staffService.disbursePayroll(id, req.body);
      return successResponse(res, data, 'Payroll marked as paid');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }
}

module.exports = new StaffController();

