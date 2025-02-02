const enrollmentController = require("../controllers/enrollmentController");
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware");
const { EMPLOYEE_POSITIONS, STUDENT_ROLES } = require('../utils/constants/rolesConstants');
const PERMISSIONS = require('../utils/constants/permissionConstants');

const RolesforModifyEnrollments = [EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.EMPLOYEE_OF_ADMISSION_REGISTRATION, EMPLOYEE_POSITIONS.HEAD_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.UNIVERSITY_PRESIDENT
];
const RolesforModifyGrades = [EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS, EMPLOYEE_POSITIONS.EMPLOYEE_OF_ACADEMIC_AFFAIRS,EMPLOYEE_POSITIONS.INSTRUCTOR]

router.delete('/:id', authenticate, authorizeRoleOrPermission([...RolesforModifyEnrollments,STUDENT_ROLES.STUDENT]), enrollmentController.deleteEnrollment);
router.patch('/:id/grades', authenticate, authorizeRoleOrPermission(RolesforModifyGrades), enrollmentController.updateGrades);
router.patch('/:id/lock', authenticate, authorizeRoleOrPermission(RolesforModifyEnrollments), enrollmentController.lockEnrollment);
router.patch('/:id/unlock', authenticate, authorizeRoleOrPermission(RolesforModifyEnrollments), enrollmentController.unlockEnrollment);
router.patch('/:id/status', authenticate, authorizeRoleOrPermission([...RolesforModifyGrades, ...RolesforModifyEnrollments]), enrollmentController.updateEnrollmentStatus);
router.post('/', authenticate, authorizeRoleOrPermission([...RolesforModifyEnrollments, STUDENT_ROLES.STUDENT]), enrollmentController.enrollInClass);
router.get('/student/:studentId', authenticate, authorizeRoleOrPermission([...RolesforModifyEnrollments, STUDENT_ROLES.STUDENT]), enrollmentController.getStudentEnrollments);
router.get('/', authenticate, authorizeRoleOrPermission(RolesforModifyEnrollments), enrollmentController.getEnrollments);

module.exports = router;
