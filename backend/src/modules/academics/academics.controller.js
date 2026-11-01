const academicsService = require('./academics.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class AcademicsController {
  async getAcademicYears(req, res) {
    try {
      const data = await academicsService.getAcademicYears();
      return successResponse(res, data, 'Academic sessions retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createAcademicYear(req, res) {
    try {
      const data = await academicsService.createAcademicYear(req.body);
      return successResponse(res, data, 'Academic session created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getClasses(req, res) {
    try {
      const data = await academicsService.getClasses();
      return successResponse(res, data, 'Classes retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createClass(req, res) {
    try {
      const data = await academicsService.createClass(req.body);
      return successResponse(res, data, 'Class created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getSections(req, res) {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId, 10) : null;
      const data = await academicsService.getSections(classId);
      return successResponse(res, data, 'Sections retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createSection(req, res) {
    try {
      const data = await academicsService.createSection(req.body);
      return successResponse(res, data, 'Section created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getSubjects(req, res) {
    try {
      const data = await academicsService.getSubjects();
      return successResponse(res, data, 'Subjects retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async createSubject(req, res) {
    try {
      const data = await academicsService.createSubject(req.body);
      return successResponse(res, data, 'Subject created', 201);
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getClassSubjects(req, res) {
    try {
      const { classId } = req.params;
      const data = await academicsService.getClassSubjects(classId);
      return successResponse(res, data, 'Class subjects retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async assignSubjectsToClass(req, res) {
    try {
      const { classId } = req.params;
      const { subjectIds } = req.body;
      const data = await academicsService.assignSubjectsToClass(classId, subjectIds);
      return successResponse(res, data, 'Subjects mapped to class successfully');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }

  async getAcademicHierarchy(req, res) {
    try {
      const data = await academicsService.getAcademicHierarchy();
      return successResponse(res, data, 'Academic hierarchy retrieved');
    } catch (err) {
      return errorResponse(res, err.message);
    }
  }
}

module.exports = new AcademicsController();

