const jwt = require('jsonwebtoken');
const Employee = require('../models/employee-model');
const Student = require('../models/student-model');
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_ACCESS_SECRET); 
        if (!decoded.id || !decoded.role || !decoded.userType) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        
        req.user = {
            id: decoded.id, 
            role: decoded.role, 
            userType: decoded.userType, 
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};


const authorizeRoleOrPermission = (allowedRoles, requiredPermissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(403).json({ message: 'Access denied: User not authenticated' });
            }

            // First, check if the user's role is allowed
            const userRole = req.user.role;
            if (allowedRoles.includes(userRole)) {
                return next();
            }

            // If the role is not allowed, check additional permissions
            if (!requiredPermissionName){
                await makeAuditLog(AUDITING.ACCESS_DENIED.action, 403, req.user.id, req.user.role, { message: 'Insufficient permissions' }, { allowedRoles, requiredPermissionName });
                return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            }

            let user;
            if (req.user.userType.toLowerCase() === 'employee') {
                user = await Employee.findById(req.user.id)
                    .select('additionalPermissions')
                    .populate({
                        path: 'additionalPermissions.permissionId',
                        select: 'name possibleForRoles deleted',
                    });
            } else if (req.user.userType.toLowerCase() === 'student') {
                user = await Student.findById(req.user.id)
                    .select('additionalPermissions')
                    .populate({
                        path: 'additionalPermissions.permissionId',
                        select: 'name possibleForRoles deleted',
                    });
            } else {
                return res.status(400).json({ message: 'Invalid user type' });
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the user has the required permission
            const hasPermission = user.additionalPermissions.some((permission) => {
                const permissionDoc = permission.permissionId;

                // Ensure the permission document exists and is not deleted
                if (!permissionDoc || permissionDoc.deleted) {
                    return false;
                }

                // Check if the permission is active
                const isPermissionActive =
                    (!permission.permissionStartDate || permission.permissionStartDate <= new Date()) &&
                    (!permission.permissionEndDate || permission.permissionEndDate >= new Date());
                // Check if the user's role is allowed for this permission
                const isRoleAllowed = permissionDoc.possibleForRoles.includes(req.user.role);

                // Check if the permission name matches and is active and allowed for the role
                return (
                    permissionDoc.name === requiredPermissionName &&
                    isPermissionActive &&
                    isRoleAllowed
                );
            });

            // Deny access if the user doesn't have the required permission
            if (!hasPermission) {
                await makeAuditLog(AUDITING.ACCESS_DENIED.action, 403, req.user.id, req.user.role, { message: 'Insufficient permissions' }, { allowedRoles, requiredPermissionName });

                return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            }

            // Allow access
            next();
        } catch (error) {
            await makeAuditLog(AUDITING.ACCESS_DENIED.action, 500, req.user.id, req.user.role, error.message, { allowedRoles, requiredPermissionName });
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

const ensureStudentSelfAccessOnly = (paramField = 'studentId') => {
    return (req, res, next) => {
        try {
            const paramValue = req.params[paramField];

            if (paramValue !== req.user.id) {
                return res.status(403).json({ message: 'You are not authorized to access this resource' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    };
};

const ensureStudentSelfAccess = (paramField = 'studentId') => {
    return (req, res, next) => {
        try {
            const paramValue = req.params[paramField];

            if(req.user.userType.toLowerCase()==='employee'){
                return next()
            }

            if (paramValue !== req.user.id) {
                return res.status(403).json({ message: 'You are not authorized to access this resource' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    };
};

const ensureEmployeeSelfAccess = async (paramField = 'employeeId') => {
    return async (req, res, next) => {
        try {
            const paramValue = req.params[paramField];

            if (paramValue !== req.user.id) {
                await makeAuditLog(AUDITING.ENSURE_EMPLOYEE_SELF_ACCESS.action, 403, req.user.id, req.user.role, null, null);
                return res.status(403).json({ message: 'You are not authorized to access this resource' });
            }

            next();
        } catch (error) {
            await makeAuditLog(AUDITING.ENSURE_EMPLOYEE_SELF_ACCESS.action, 500, req.user.id, req.user.role, error.message, null);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = { authenticate, authorizeRoleOrPermission, ensureStudentSelfAccessOnly, ensureEmployeeSelfAccess, ensureStudentSelfAccess }