const feesService = require('./fees.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class FeesController {
  async getFeeHeads(req, res) {
    try {
      const data = await feesService.getFeeHeads();
      return successResponse(res, data, 'Fee heads retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createFeeHead(req, res) {
    try {
      const data = await feesService.createFeeHead(req.body);
      return successResponse(res, data, 'Fee head created', 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getFeeStructures(req, res) {
    try {
      const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId, 10) : null;
      const classId = req.query.classId ? parseInt(req.query.classId, 10) : null;
      const data = await feesService.getFeeStructures(academicYearId, classId);
      return successResponse(res, data, 'Fee structures retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async saveFeeStructure(req, res) {
    try {
      const data = await feesService.saveFeeStructure(req.body);
      return successResponse(res, data, 'Fee structure rule saved');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async bulkGenerateVouchers(req, res) {
    try {
      const data = await feesService.bulkGenerateVouchers(req.body, req.user.id);
      return successResponse(res, data, `Bulk generation complete: ${data.generated_count} vouchers created`, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async searchVouchers(req, res) {
    try {
      const filters = {
        search: req.query.search || null,
        status: req.query.status || null,
        monthYear: req.query.monthYear || null,
        classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
        studentId: req.query.studentId ? parseInt(req.query.studentId, 10) : (req.user.role === 'student' ? req.user.studentId : null)
      };
      const data = await feesService.searchVouchers(filters);
      return successResponse(res, data, 'Fee vouchers retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async collectPayment(req, res) {
    try {
      const data = await feesService.collectPayment(req.body, req.user.id);
      return successResponse(res, data, `Payment collected successfully. Receipt: ${data.receipt_no}`, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getVoucherChallan(req, res) {
    try {
      const { id } = req.params;
      const data = await feesService.getVoucherChallan(id);
      return successResponse(res, data, 'Challan data retrieved');
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async getFinancialStats(req, res) {
    try {
      const monthYear = req.query.monthYear || null;
      const data = await feesService.getFinancialStats(monthYear);
      return successResponse(res, data, 'Financial statistics retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new FeesController();

