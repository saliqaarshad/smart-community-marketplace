const express = require('express');
const router = express.Router();
const { startConversation, getMyConversations, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', startConversation);
router.get('/', getMyConversations);
router.get('/:id/messages', getMessages);

module.exports = router;