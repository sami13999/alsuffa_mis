const express = require('express');
const router = express.Router();
const studentsController = require('./students.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// Admin & Accountant & Teacher can view students
router.get('/', authorizeRoles('admin', 'accountant', 'teacher'), (req, res) => studentsController.getStudents(req, res));
router.get('/:id', authorizeRoles('admin', 'accountant', 'teacher'), (req, res) => studentsController.getStudentById(req, res));

// Admin only can admit new students
router.post('/admit', authorizeRoles('admin'), (req, res) => studentsController.admitStudent(req, res));

module.exports = router;

