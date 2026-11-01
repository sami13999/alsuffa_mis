const express = require('express');
const router = express.Router();
const staffController = require('./staff.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// Admin & Accountant can view staff
router.get('/', authorizeRoles('admin', 'accountant'), (req, res) => staffController.getStaffList(req, res));
router.get('/payroll', authorizeRoles('admin', 'accountant'), (req, res) => staffController.getPayrollRecords(req, res));
router.get('/:id', authorizeRoles('admin', 'accountant'), (req, res) => staffController.getStaffById(req, res));

// Admin can register staff
router.post('/register', authorizeRoles('admin'), (req, res) => staffController.registerStaff(req, res));

// Accountant & Admin can process and disburse payroll
router.post('/payroll/generate', authorizeRoles('admin', 'accountant'), (req, res) => staffController.generatePayroll(req, res));
router.patch('/payroll/:id/pay', authorizeRoles('admin', 'accountant'), (req, res) => staffController.disbursePayroll(req, res));

module.exports = router;

