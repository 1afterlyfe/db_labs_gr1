const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/', questionController.getAll);
router.get('/:id', questionController.getById);
router.post('/', questionController.create);
router.patch('/:id', questionController.update);
router.delete('/:id', questionController.remove);

module.exports = router;