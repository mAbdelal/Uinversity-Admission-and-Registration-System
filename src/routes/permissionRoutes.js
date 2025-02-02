const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS }=require("../utils/constants/rolesConstants")


router.post("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]),permissionController.createPermission);
router.delete("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]), permissionController.deletePermission);
router.patch("/:id/activate", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]), permissionController.activatePermission);
router.post('/:permissionId/grant', authenticate, permissionController.grantPermission);
router.delete('/:permissionId/revoke', authenticate, permissionController.revokePermission);
router.post('/:permissionId/add-granter', authenticate, permissionController.addGranter);
router.delete('/:permissionId/remove-granter', authenticate, permissionController.deleteGranter);
router.post('/:permissionId/add-possible-for-role', authenticate, permissionController.addPossibleForRole);
router.delete('/:permissionId/remove-possible-for-role', authenticate, permissionController.deletePossibleForRole);
router.post('/:permissionId/add-possible-granter-role', authenticate, permissionController.addPossibleGranterRole);
router.delete('/:permissionId/remove-possible-granter-role', authenticate, permissionController.deletePossibleGranterRole);
router.get('/', authenticate, permissionController.filterPermissions);

module.exports = router;