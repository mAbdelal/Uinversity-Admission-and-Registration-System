const classController = require("../controllers/classController");
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS, STUDENT_ROLES } = require('../utils/constants/rolesConstants');


const RolesforModifyClasses = [EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.EMPLOYEE_OF_ADMISSION_REGISTRATION, EMPLOYEE_POSITIONS.HEAD_OF_ADMISSION_REGISTRATION,
];


router.post("/", authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.createClass);
router.get("/", authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.getClasses);
router.patch('/change-classes-status', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), classController.changeClassesStatus);
router.patch("/:id", authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.updateClass);
router.delete("/:id", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION]), classController.deleteClass);
router.post('/:id/appointments', authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.addAppointment );
router.delete('/:id/appointments/:appointmentId', authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.deleteAppointment);
router.patch('/:id/lock', authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.lockClass);
router.patch('/:id/unlock', authenticate, authorizeRoleOrPermission(RolesforModifyClasses), classController.unlockClass);

module.exports = router;