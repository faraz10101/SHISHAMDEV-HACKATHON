const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const c = require('../controllers/admin.controller');

router.use(adminAuth);
router.get('/providers', c.list);
router.post('/providers', c.create);
router.post('/providers/reset-cooldowns', c.resetCooldowns);
router.patch('/providers/:id', c.update);
router.delete('/providers/:id', c.remove);
router.post('/providers/:id/test', c.test);

module.exports = router;
