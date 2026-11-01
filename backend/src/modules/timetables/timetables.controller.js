const timetablesService = require('./timetables.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class TimetablesController {
  async getTimetables(req, res) {
    try {
      const filters = {
        academicYearId: req.query.academicYearId ? parseInt(req.query.academicYearId, 10) : null,
        classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
        sectionId: req.query.sectionId ? parseInt(req.query.sectionId, 10) : null,
        teacherId: req.query.teacherId ? parseInt(req.query.teacherId, 10) : null,
        dayOfWeek: req.query.dayOfWeek || null
      };
      const data = await timetablesService.getTimetables(filters);
      return successResponse(res, data, 'Timetables retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createTimetableSlot(req, res) {
    try {
      const data = await timetablesService.createTimetableSlot(req.body);
      return successResponse(res, data, 'Timetable schedule slot created', 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteTimetableSlot(req, res) {
    try {
      const { id } = req.params;
      const data = await timetablesService.deleteTimetableSlot(id);
      return successResponse(res, data, 'Timetable slot removed');
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async getTeacherSchedule(req, res) {
    try {
      const staffId = req.params.staffId || req.user.staffId;
      if (!staffId) {
        return errorResponse(res, 'Teacher staff ID not found in session or parameters', 400);
      }
      const data = await timetablesService.getTeacherSchedule(staffId);
      return successResponse(res, data, 'Teacher schedule retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getStudentSchedule(req, res) {
    try {
      let classId = req.query.classId;
      let sectionId = req.query.sectionId;

      if (!classId && req.user.enrollment) {
        classId = req.user.enrollment.class_id;
        sectionId = req.user.enrollment.section_id;
      }

      if (!classId || !sectionId) {
        return errorResponse(res, 'classId and sectionId are required to view student schedule', 400);
      }

      const data = await timetablesService.getStudentSchedule(classId, sectionId);
      return successResponse(res, data, 'Student timetable schedule retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new TimetablesController();

