const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { telegramStatus, sendTestDispatch } = require('../utils/telegram');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/telegram-status — which tiers are configured (counts only, never the token)
router.get('/telegram-status', (req, res) => {
  res.json(telegramStatus());
});

// POST /api/admin/telegram-test — broadcast a test message to all configured chat IDs
router.post('/telegram-test', async (req, res, next) => {
  try {
    res.json(await sendTestDispatch());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
