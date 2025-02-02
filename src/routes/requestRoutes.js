const requestController = require("../controllers/requestController");
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS } = require('../utils/constants/rolesConstants');

router.post("/", authenticate, requestController.createRequest);
router.put("/respond/:requestId", authenticate, requestController.respondToRequest);
router.get("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.ADMIN, EMPLOYEE_POSITIONS.UNIVERSITY_PRESIDENT]), requestController.getRequests);
router.get("/own/requests", authenticate, requestController.getOwnRequests);
router.get("/own/responses", authenticate, requestController.getOwnResponses);

module.exports = router;