const express = require('express');
const router = express.Router();
const academicsController = require('./academics.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// Publicly readable by all authenticated users
router.get('/sessions', (req, res) => academicsController.getAcademicYears(req, res));
router.get('/classes', (req, res) => academicsController.getClasses(req, res));
router.get('/sections', (req, res) => academicsController.getSections(req, res));
router.get('/subjects', (req, res) => academicsController.getSubjects(req, res));
router.get('/classes/:classId/subjects', (req, res) => academicsController.getClassSubjects(req, res));
router.get('/hierarchy', (req, res) => academicsController.getAcademicHierarchy(req, res));

// Admin management routes
router.post('/sessions', authorizeRoles('admin'), (req, res) => academicsController.createAcademicYear(req, res));
router.post('/classes', authorizeRoles('admin'), (req, res) => academicsController.createClass(req, res));
router.post('/sections', authorizeRoles('admin'), (req, res) => academicsController.createSection(req, res));
router.post('/subjects', authorizeRoles('admin'), (req, res) => academicsController.createSubject(req, res));
router.post('/classes/:classId/subjects', authorizeRoles('admin'), (req, res) => academicsController.assignSubjectsToClass(req, res));

module.exports = router;

