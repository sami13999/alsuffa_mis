const examinationsService = require('./examinations.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class ExaminationsController {
  async getExams(req, res) {
    try {
      const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId, 10) : null;
      const data = await examinationsService.getExams(academicYearId);
      return successResponse(res, data, 'Exams retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createExam(req, res) {
    try {
      const data = await examinationsService.createExam(req.body);
      return successResponse(res, data, 'Exam created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const { is_published } = req.body;
      const data = await examinationsService.togglePublishExam(id, is_published);
      return successResponse(res, data, `Exam publication status updated to ${is_published ? 'published' : 'draft'}`);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getSchedules(req, res) {
    try {
      const filters = {
        examId: req.query.examId ? parseInt(req.query.examId, 10) : null,
        classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
        subjectId: req.query.subjectId ? parseInt(req.query.subjectId, 10) : null
      };
      const data = await examinationsService.getExamSchedules(filters);
      return successResponse(res, data, 'Exam schedules retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createSchedule(req, res) {
    try {
      const data = await examinationsService.createExamSchedule(req.body);
      return successResponse(res, data, 'Exam schedule created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getMarksEntrySheet(req, res) {
    try {
      const { scheduleId } = req.params;
      const data = await examinationsService.getMarksEntrySheet(scheduleId);
      return successResponse(res, data, 'Marks entry sheet loaded');
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async saveMassMarks(req, res) {
    try {
      const { scheduleId } = req.params;
      const { marks } = req.body;
      if (!Array.isArray(marks)) {
        return errorResponse(res, 'Marks array is required', 400);
      }
      const data = await examinationsService.saveMassMarks(scheduleId, marks);
      return successResponse(res, data, 'Exam marks saved successfully');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getStudentReportCard(req, res) {
    try {
      const studentId = req.params.studentId || req.user.studentId;
      if (!studentId) {
        return errorResponse(res, 'Student ID not found in session or parameters', 400);
      }
      const examId = req.query.examId ? parseInt(req.query.examId, 10) : null;
      const data = await examinationsService.getStudentReportCard(studentId, examId);
      return successResponse(res, data, 'Report card retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new ExaminationsController();

