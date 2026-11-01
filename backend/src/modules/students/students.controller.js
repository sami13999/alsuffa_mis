const studentsService = require('./students.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class StudentsController {
  async admitStudent(req, res) {
    try {
      const data = await studentsService.admitStudent(req.body);
      return successResponse(res, data, 'Student admitted and enrolled successfully', 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getStudents(req, res) {
    try {
      const filters = {
        classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
        sectionId: req.query.sectionId ? parseInt(req.query.sectionId, 10) : null,
        academicYearId: req.query.academicYearId ? parseInt(req.query.academicYearId, 10) : null,
        search: req.query.search || null,
        status: req.query.status || null
      };
      const data = await studentsService.getStudents(filters);
      return successResponse(res, data, 'Students retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const data = await studentsService.getStudentById(id);
      return successResponse(res, data, 'Student record retrieved');
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }
}

module.exports = new StudentsController();

