// These routes are outside the scope of the system and are intended for Academic Affairs,
//  but I’ve implemented a small portion of them.
const courseController=require("../controllers/courseController")
const express=require("express");
const router=express.Router();
const { authenticate, authorizeRoleOrPermission }=require("../middlewares/authMiddleware")
const {EMPLOYEE_POSITIONS}=require('../utils/constants/rolesConstants');
const  PERMISSIONS  = require('../utils/constants/permissionConstants');

const RolesforGetCourses = [EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS, EMPLOYEE_POSITIONS.DEAN_OF_ADMISSION_REGISTRATION,
    EMPLOYEE_POSITIONS.EMPLOYEE_OF_ADMISSION_REGISTRATION, EMPLOYEE_POSITIONS.HEAD_OF_ADMISSION_REGISTRATION,
    EMPLOYEE_POSITIONS.UNIVERSITY_PRESIDENT, EMPLOYEE_POSITIONS.EMPLOYEE_OF_ACADEMIC_AFFAIRS,
];

const RolesforModifyCourses = [EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS, EMPLOYEE_POSITIONS.EMPLOYEE_OF_ACADEMIC_AFFAIRS]

router.post('/', authenticate, authorizeRoleOrPermission([EMPLOYEE_POSITIONS.DEAN_OF_ACADEMIC_AFFAIRS], PERMISSIONS.CREATE_COURSE), 
            courseController.createCourse);
router.get('/non-active', authenticate, authorizeRoleOrPermission(RolesforGetCourses), courseController.getNonActiveCourses);
router.get('/', authenticate, authorizeRoleOrPermission(RolesforGetCourses), courseController.getCourses);
router.get('/:id', authenticate, authorizeRoleOrPermission(RolesforGetCourses), courseController.getCourseById);
router.patch('/:id/activate', authenticate, authorizeRoleOrPermission(RolesforModifyCourses), courseController.activateCourse);
router.patch('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyCourses, PERMISSIONS.UPDATE_COURSE), courseController.updateCourse);
router.post('/:id/prerequisites', authenticate, authorizeRoleOrPermission(RolesforModifyCourses, PERMISSIONS.UPDATE_COURSE), courseController.addPrerequisite);
router.delete("/:id/prerequisites/:prerequisiteId", authenticate, authorizeRoleOrPermission(RolesforModifyCourses, PERMISSIONS.UPDATE_COURSE), courseController.removePrerequisite);
router.delete('/:id', authenticate, authorizeRoleOrPermission(RolesforModifyCourses, PERMISSIONS.DELETE_COURSE), courseController.softDeleteCourse);


module.exports = router;


