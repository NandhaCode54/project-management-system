const express = require('express');

const projectController = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/common');
const { projectCreateSchema, projectUpdateSchema, projectQuerySchema } = require('../validators/project');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validate.query(projectQuerySchema), projectController.listProjects);
router.get('/:id', validate.params(idParamSchema), projectController.getProject);
router.post('/', validate.body(projectCreateSchema), projectController.createProject);
router.put('/:id', validate.params(idParamSchema), validate.body(projectUpdateSchema), projectController.updateProject);
router.delete('/:id', validate.params(idParamSchema), projectController.deleteProject);

module.exports = router;