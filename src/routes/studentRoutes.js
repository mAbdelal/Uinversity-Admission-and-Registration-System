const studentsController = require("../controllers/studentsController")
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission, ensureStudentSelfAccessOnly, ensureStudentSelfAccess } = require("../middlewares/authMiddleware")
const { EMPLOYEE_POSITIONS, STUDENT_ROLES } = require('../utils/constants/rolesConstants');
const PERMISSIONS = require('../utils/constants/permissionConstants');
const upload=require("../utils/multerConfig")

const RolesforModifyStudents = [EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.EMPLOYEE_OF_ADMISSION_REGISTRATION, EMPLOYEE_POSITIONS.HEAD_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.UNIVERSITY_PRESIDENT
];

const STUDENT_ROLE = STUDENT_ROLES.STUDENT;

router.post("/", authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.createStudent);
router.get('/', authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.getStudents);
router.get('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.getStudentById);
router.delete('/:id', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION], PERMISSIONS.DELETE_STUDENT), studentsController.deleteStudent);
router.patch("/:id/basic-info", authenticate, ensureStudentSelfAccessOnly("id"), studentsController.updateStudentBasicInfo);
router.patch("/:id", authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.updateAllStudentInfo);
router.put('/:studentId/idDocument', authenticate, authorizeRoleOrPermission(RolesforModifyStudents), upload.single('idDocument'), studentsController.replaceIdDocument);
router.post("/:studentId/previous-degrees", upload.fields([
    { name: 'transcript', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]), studentsController.addPreviousDegree);
router.delete("/:studentId/previous-degrees/:degreeId", authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.removePreviousDegree);
router.post("/:studentId/notifications", authenticate, authorizeRoleOrPermission(RolesforModifyStudents), studentsController.sendNotificationToStudent);
router.delete('/:studentId/notifications/:notificationId', authenticate, ensureStudentSelfAccessOnly("studentId"), studentsController.deleteNotificationById);
router.delete('/:studentId/notifications', authenticate, ensureStudentSelfAccessOnly("studentId"), studentsController.deleteAllNotifications);
router.get('/:studentId/notifications', authenticate, ensureStudentSelfAccessOnly("studentId"), studentsController.getAllNotifications);
router.get('/:studentId/available-classes', authenticate, authorizeRoleOrPermission([...RolesforModifyStudents, STUDENT_ROLES.STUDENT]),ensureStudentSelfAccess("studentId"), studentsController.getAvailableClassesForStudent);

module.exports = router;


