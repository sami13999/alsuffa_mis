const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/metrics', (req, res) => dashboardController.getMetrics(req, res));

module.exports = router;

