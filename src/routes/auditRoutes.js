const auditController = require("../controllers/auditController");
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS } = require('../utils/constants/rolesConstants');

router.get("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]), auditController.getAuditLogs);
router.get("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]), auditController.getAuditLogById);
router.delete("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN]), auditController.deleteOldAudits);


module.exports = router;