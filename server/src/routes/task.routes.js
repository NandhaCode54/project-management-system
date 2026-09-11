const express = require('express');

const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/common');
const { taskCreateSchema, taskUpdateSchema, taskQuerySchema } = require('../validators/task');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validate.query(taskQuerySchema), taskController.listTasks);
router.get('/:id', validate.params(idParamSchema), taskController.getTask);
router.post('/', validate.body(taskCreateSchema), taskController.createTask);
router.put('/:id', validate.params(idParamSchema), validate.body(taskUpdateSchema), taskController.updateTask);
router.patch('/:id/complete', validate.params(idParamSchema), taskController.completeTask);
router.delete('/:id', validate.params(idParamSchema), taskController.deleteTask);

module.exports = router;