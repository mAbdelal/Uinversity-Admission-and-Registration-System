// These routes are outside the scope of the system.
// However, I’ve implemented a small portion as an example.
// This functionality is the responsibility of the Human Resources department.
const employeesController = require("../controllers/employeesController")
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission, ensureEmployeeSelfAccess } = require("../middlewares/authMiddleware")
const { EMPLOYEE_POSITIONS } = require('../utils/constants/rolesConstants');
const upload = require("../utils/multerConfig");
const PERMISSIONS = require('../utils/constants/permissionConstants');


const RolesforModifyEmployees = [EMPLOYEE_POSITIONS.HEAD_OF_HUMAN_RESOURCES, EMPLOYEE_POSITIONS.HR_MANAGER,
    EMPLOYEE_POSITIONS.HR_OFFICER
];


router.post("/", authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), upload.single('idDocument'), employeesController.createEmployee);
router.get('/', authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), employeesController.getEmployees);
router.get('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), employeesController.getEmployeeById);
router.delete('/:id', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.HEAD_OF_HUMAN_RESOURCES], PERMISSIONS.DELETE_EMPLOYEE), employeesController.deleteEmployee);
router.patch('/:id/activate', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.HEAD_OF_HUMAN_RESOURCES], PERMISSIONS.DELETE_EMPLOYEE), employeesController.activateEmployee);
router.patch("/:id/basic-info", authenticate, ensureEmployeeSelfAccess("id"), employeesController.updateBasicEmployeeInfo);
router.patch("/:id", authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), employeesController.updateAllEmployeeInfo);
router.put('/:employeeId/idDocument', authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), upload.single('idDocument'), employeesController.replaceIdDocument);
router.post("/:employeeId/qualifications", upload.fields([
    { name: 'transcript', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]), employeesController.addQualifications);

router.delete("/:employeeId/qualifications/:qualificationId", authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), employeesController.deleteQualification);
router.delete("/:employeeId/positions/:positionId", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.HEAD_OF_HUMAN_RESOURCES]), employeesController.endPosition);
router.post("/:employeeId/positions", authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.HEAD_OF_HUMAN_RESOURCES]), employeesController.addPosition);
router.post("/:employeeId/notifications", authenticate, authorizeRoleOrPermission(RolesforModifyEmployees), employeesController.sendNotificationToEmployee);
router.delete('/:employeeId/notifications/:notificationId', authenticate, ensureEmployeeSelfAccess("employeeId"), employeesController.deleteNotificationById);
router.delete('/:employeeId/notifications', authenticate, ensureEmployeeSelfAccess("employeeId"), employeesController.deleteAllNotifications);
router.get('/:employeeId/notifications', authenticate, ensureEmployeeSelfAccess("employeeId"), employeesController.getAllNotifications);

module.exports = router;