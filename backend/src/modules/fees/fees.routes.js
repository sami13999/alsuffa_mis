const express = require('express');
const router = express.Router();
const feesController = require('./fees.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

// Student accessible routes (their own vouchers and challans)
router.get('/vouchers', (req, res) => feesController.searchVouchers(req, res));
router.get('/vouchers/:id/challan', (req, res) => feesController.getVoucherChallan(req, res));

// Admin & Accountant routes
router.get('/stats', authorizeRoles('admin', 'accountant'), (req, res) => feesController.getFinancialStats(req, res));
router.get('/heads', authorizeRoles('admin', 'accountant'), (req, res) => feesController.getFeeHeads(req, res));
router.post('/heads', authorizeRoles('admin', 'accountant'), (req, res) => feesController.createFeeHead(req, res));
router.get('/structures', authorizeRoles('admin', 'accountant'), (req, res) => feesController.getFeeStructures(req, res));
router.post('/structures', authorizeRoles('admin', 'accountant'), (req, res) => feesController.saveFeeStructure(req, res));
router.post('/vouchers/generate', authorizeRoles('admin', 'accountant'), (req, res) => feesController.bulkGenerateVouchers(req, res));
router.post('/payments/collect', authorizeRoles('admin', 'accountant'), (req, res) => feesController.collectPayment(req, res));

module.exports = router;

