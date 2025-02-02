// These routes are outside the scope of the system and are intended for Academic Affairs,
//  but I’ve implemented a small portion of them.
const facultyController = require("../controllers/facultyController")
const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoleOrPermission } = require("../middlewares/authMiddleware")
const { EMPLOYEE_POSITIONS } = require('../utils/constants/rolesConstants');
const PERMISSIONS = require('../utils/constants/permissionConstants');

const RolesforGetFaculties = [EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS, EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.EMPLOYEE_OF_ADMISSION_REGISTRATION, EMPLOYEE_POSITIONS.HEAD_OF_ADMISSION_REGISTRATION,
EMPLOYEE_POSITIONS.UNIVERSITY_PRESIDENT, EMPLOYEE_POSITIONS.EMPLOYEE_OF_ACADEMIC_AFFAIRS,
];

const RolesforModifyFaculties = [EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS]

router.post('/', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS], PERMISSIONS.CREATE_COURSE),
    facultyController.createFaculty);
router.post('/:id/departments', authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.addDepartmentToFaculty);
router.get('/', authenticate, authorizeRoleOrPermission(RolesforGetFaculties), facultyController.getFaculties);
router.get('/:id', authenticate, authorizeRoleOrPermission(RolesforGetFaculties), facultyController.getFacultyById);
router.delete('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.softDeleteFaculty);
router.delete("/:id/departments/:departmentId", authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.removeDepartmentFromFaculty);
router.patch('/:id/activate', authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.activateFaculty);
router.patch('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.updateFaculty);
router.patch('/:id/departments/:departmentId', authenticate, authorizeRoleOrPermission(RolesforModifyFaculties), facultyController.updateDepartment);

module.exports = router;






