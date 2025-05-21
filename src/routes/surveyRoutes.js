const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.get('/', surveyController.getAll);
router.get('/:id', surveyController.getById);
router.post('/', surveyController.create);
router.patch('/:id', surveyController.update);
router.delete('/:id', surveyController.remove);

module.exports = router;