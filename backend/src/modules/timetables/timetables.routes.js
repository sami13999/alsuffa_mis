const express = require('express');
const router = express.Router();
const timetablesController = require('./timetables.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// Publicly accessible for authenticated users
router.get('/', (req, res) => timetablesController.getTimetables(req, res));
router.get('/my-teacher-schedule/:staffId?', authorizeRoles('admin', 'teacher'), (req, res) => timetablesController.getTeacherSchedule(req, res));
router.get('/my-student-schedule', (req, res) => timetablesController.getStudentSchedule(req, res));

// Admin management
router.post('/', authorizeRoles('admin'), (req, res) => timetablesController.createTimetableSlot(req, res));
router.delete('/:id', authorizeRoles('admin'), (req, res) => timetablesController.deleteTimetableSlot(req, res));

module.exports = router;

