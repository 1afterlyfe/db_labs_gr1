const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');

router.get('/', responseController.getAll);
router.get('/:id', responseController.getById);
router.post('/', responseController.create);
router.patch('/:id', responseController.update);
router.delete('/:id', responseController.remove);

module.exports = router;