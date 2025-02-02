const semesterController = require("../controllers/semesterController");
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS } = require('../utils/constants/rolesConstants');

router.post("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]),semesterController.createSemester);
router.get("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), semesterController.getSemesterById);
router.patch("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), semesterController.updateSemester);
router.delete("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), semesterController.deleteSemester);
router.get("/", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), semesterController.getSemesters);

module.exports = router;