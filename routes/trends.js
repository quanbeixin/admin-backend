const express = require('express');
const router = express.Router();
const trendsController = require('../controllers/trendsController');

// GET /api/trends/today?platform=tiktok&limit=50
router.get('/today', trendsController.getToday);

// GET /api/trends/hot-topics?platform=midjourney&limit=20&days=7
router.get('/hot-topics', trendsController.getHotTopics);

module.exports = router;
