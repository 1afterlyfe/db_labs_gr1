const express = require('express');
const router = express.Router();
const surveyLinkController = require('../controllers/surveyLinkController');

router.get('/', surveyLinkController.getAll);
router.get('/:id', surveyLinkController.getById);
router.post('/', surveyLinkController.create);
router.patch('/:id', surveyLinkController.update);
router.delete('/:id', surveyLinkController.remove);

module.exports = router;
