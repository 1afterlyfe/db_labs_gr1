const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');

router.get('/', answerController.getAll);
router.get('/:id', answerController.getById);
router.post('/', answerController.create);
router.patch('/:id', answerController.update);
router.delete('/:id', answerController.remove);

module.exports = router;
