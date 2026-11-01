const express = require('express');
const router = express.Router();
const examinationsController = require('./examinations.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// View exams & schedules (all authenticated roles)
router.get('/', (req, res) => examinationsController.getExams(req, res));
router.get('/schedules', (req, res) => examinationsController.getSchedules(req, res));
router.get('/schedules/:scheduleId/marks-sheet', authorizeRoles('admin', 'teacher'), (req, res) => examinationsController.getMarksEntrySheet(req, res));

// Admin & Teacher marks submission
router.post('/schedules/:scheduleId/marks', authorizeRoles('admin', 'teacher'), (req, res) => examinationsController.saveMassMarks(req, res));

// Report Card
router.get('/report-card/:studentId?', (req, res) => examinationsController.getStudentReportCard(req, res));

// Admin exam management
router.post('/', authorizeRoles('admin'), (req, res) => examinationsController.createExam(req, res));
router.patch('/:id/publish', authorizeRoles('admin'), (req, res) => examinationsController.togglePublish(req, res));
router.post('/schedules', authorizeRoles('admin'), (req, res) => examinationsController.createSchedule(req, res));

module.exports = router;

