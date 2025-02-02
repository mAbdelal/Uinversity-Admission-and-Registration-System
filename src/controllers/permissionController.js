const Permission = require('../models/permission-model');
const Employee=require("../models/employee-model");
const Student = require("../models/student-model");
const {STUDENT_ROLES}=require("../utils/constants/rolesConstants");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");


const createPermission = async (req, res) => {
    try {
        const { name, owner} = req.body;

        const userRole = req.user.role;

        if (userRole.toLowerCase() !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to make permission" });
        }

        const permission = new Permission({
            name,
            owner
        });

        await permission.save();

        await makeAuditLog(AUDITING.CREATE_PERMISSION.action, 200, req.user.id, req.user.role, null, { name });

        res.status(201).send(permission);
    } catch (error) {
        res.status(400).send(error);
    }
};


const deletePermission = async (req, res) => {
    const { id } = req.params;

    try {
        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        const userRole = req.user.role;   

        if (userRole.toLowerCase() !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to delete this permission" });
        }

        permission.deleted = true;
        await permission.save();

        await makeAuditLog(AUDITING.DELETE_PERMISSION.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Permission deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const activatePermission = async (req, res) => {
    const { id } = req.params;

    try {
        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        if (!permission.deleted) {
            return res.status(400).json({ message: "Permission is not deleted" });
        }

        permission.deleted = false;
        await permission.save();

        await makeAuditLog(AUDITING.ACTIVATE_PERMISSION.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Permission activated successfully", permission });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const grantPermission = async (req, res) => {
    const { permissionId } = req.params;
    const { permissionEndDate, targetUserId } = req.body;
    const granterUserRole = req.user.role;
    const granterUserId = req.user.id;

    const isEmployee = targetUserId.startsWith('E');
    const isStudent = targetUserId.startsWith('S');

    if (!isEmployee && !isStudent) {
        return res.status(400).json({ message: "Invalid targetUserId. It should start with 'E' for Employee or 'S' for Student." });
    }

    try {
        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 3: Determine the target user's role
        let targetUserRole, targetUser;
        if (isEmployee) {
            targetUser = await Employee.findById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({ message: "Employee not found" });
            }
            targetUserRole = targetUser.getCurrentPositionTitle();
        } else if (isStudent) {
            targetUser = await Student.findById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({ message: "Student not found" });
            }
            targetUserRole = STUDENT_ROLES.STUDENT;
        } else {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        // Step 4: Check if the user already has the permission
        if (targetUser.additionalPermissions.some(permissionObj => permissionObj.permissionId.toString() === permissionId.toString())) {
            return res.status(403).json({ message: "The target user already has this permission" });
        }

        // Step 5: Check if the user's role matches the owner role in the permission
        if (granterUserRole === permission.owner) {
            // Owner can grant/revoke permissions, but also need to check possibleForRoles
            if (!permission.possibleForRoles.includes(targetUserRole)) {
                return res.status(403).json({ message: "This permission cannot be granted to the target user" });
            }

            // Proceed to grant the permission
            permission.usersWithPermission.push(targetUserId);
            await permission.save();

            // Create the new permission object
            const newPermission = {
                permissionId: permission._id,
                permissionStartDate:new Date(),
                grantedBy: granterUserId 
            };

            // Only add permissionEndDate if provided
            if (permissionEndDate) {
                newPermission.permissionEndDate = permissionEndDate;
            }

            // Determine the target model: Employee or Student
            const targetModel = isEmployee ? Employee : Student;

            // Push the permission to the additionalPermissions array of the target user
            const target = await targetModel.findById(targetUserId);
            target.additionalPermissions.push(newPermission);
            await target.save();

            await makeAuditLog(AUDITING.GRANT_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, targetUserId });

            res.status(200).json({ message: "Permission granted successfully", permission: newPermission });
            return;
        }

        // Step 6: If the granter is not the owner, check if the granter is in the granter array
        if (!permission.granter.includes(granterUserId)) {
            return res.status(403).json({ message: "You do not have the ability to grant/revoke this permission" });
        }

        // Step 7: Check if the target user's role is within possibleForRoles
        if (!permission.possibleForRoles.includes(targetUserRole)) {
            return res.status(403).json({ message: "This permission cannot be granted to the target user" });
        }

        permission.usersWithPermission.push(targetUserId);
        await permission.save();

        const newPermission = {
            permissionId: permission._id,
            permissionStartDate:new Date(),
            grantedBy: granterUserId
        };

        // Only add permissionEndDate if provided
        if (permissionEndDate) {
            newPermission.permissionEndDate = permissionEndDate;
        }

        // Determine the target model: Employee or Student
        const targetModel = isEmployee ? Employee : Student;

        // Push the permission to the additionalPermissions array of the target user
        const target = await targetModel.findById(targetUserId);
        target.additionalPermissions.push(newPermission);
        await target.save();

        await makeAuditLog(AUDITING.GRANT_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, targetUserId });

        res.status(200).json({ message: "Permission granted successfully", permission: newPermission });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const revokePermission = async (req, res) => {
    try {
        const { targetUserId } = req.body; 
        const { permissionId } = req.params; 
        const revokerUserId = req.user.id;
        const revokerRole = req.user.role; 

        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 2: Validate target user (must be an Employee or Student)
        let targetUser;
        if (targetUserId.startsWith('E')) {
            targetUser = await Employee.findById(targetUserId);
        } else if (targetUserId.startsWith('S')) {
            targetUser = await Student.findById(targetUserId);
        } else {
            return res.status(400).json({ message: "Invalid targetUserId format" });
        }

        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Step 3: Check if the target user actually has the permission
        const existingPermission = targetUser.additionalPermissions.find(
            (perm) => perm.permissionId.toString() === permissionId.toString()
        );

        if (!existingPermission) {
            return res.status(403).json({ message: "The target user does not have this permission" });
        }

        // Step 4: Permission revocation rules
        if (revokerRole === permission.owner || permission.granter.includes(revokerUserId)) {
            // Step 5: Remove the target user from `usersWithPermission` in the Permission document
            permission.usersWithPermission = permission.usersWithPermission.filter(
                (userId) => userId.toString() !== targetUserId
            );
            await permission.save();

            // Step 6: Remove the permission from the target user's `additionalPermissions` array
            targetUser.additionalPermissions = targetUser.additionalPermissions.filter(
                (perm) => perm.permissionId.toString() !== permissionId.toString()
            );
            await targetUser.save();

            await makeAuditLog(AUDITING.REVOKE_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, targetUserId });

            return res.status(200).json({ message: "Permission revoked successfully" });
        }

        // Step 7: Deny revocation if the user does not have permission
        return res.status(403).json({ message: "You do not have the ability to revoke this permission" });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const addGranter = async (req, res) => {
    try {
        // Step 1: Extract data from the request body
        const { targetUserId } = req.body;
        const { permissionId }=req.params;
        const granterUserRole = req.user.role;

        // Step 2: Fetch the permission by ID
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 3: Ensure only the owner can assign granters
        if (granterUserRole !== permission.owner) {
            return res.status(403).json({ message: "Only the permission owner can assign new granters" });
        }

        // Step 4: Fetch the target user's role
        let targetUserRole, targetUser;
        if (targetUserId.startsWith('E')) {
            targetUser = await Employee.findById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({ message: "Employee not found" });
            }
            targetUserRole = targetUser.getCurrentPositionTitle();
        } else {
            return res.status(400).json({ message: "Only employees can be assigned as granters" });
        }

        // Step 5: Check if the target user's role is eligible to be a granter
        if (!permission.possibleGranterRoles.includes(targetUserRole)) {
            return res.status(403).json({ message: "This user cannot be assigned as a granter" });
        }

        // Step 6: Ensure the user is not already a granter
        if (permission.granter.includes(targetUserId)) {
            return res.status(403).json({ message: "User is already a granter for this permission" });
        }

        // Step 7: Add the target user to the list of granters
        permission.granter.push(targetUserId);
        await permission.save();

        await makeAuditLog(AUDITING.ADD_GRANTER_TO_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, targetUserId });

        res.status(200).json({ message: "Granter added successfully", permission });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteGranter = async (req, res) => {
    try {
        // Step 1: Extract data from the request
        const { permissionId } = req.params;
        const { targetUserId }=req.body;
        const deleterUserROle = req.user.role; 

        // Step 2: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 4: Ensure only the owner can revoke granter status
        if (deleterUserROle !== permission.owner) {
            return res.status(403).json({ message: "Only the permission owner can revoke granter status" });
        }

        // Step 5: Ensure the target user is currently a granter
        if (!permission.granter.includes(targetUserId)) {
            return res.status(403).json({ message: "User is not a granter for this permission" });
        }

        // Step 6: Remove the user from the granter list
        permission.granter = permission.granter.filter(id => id !== targetUserId);
        await permission.save();

        await makeAuditLog(AUDITING.REMOVE_GRANTER_TO_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, targetUserId });

        res.status(200).json({ message: "Granter removed successfully", permission });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const addPossibleForRole = async (req, res) => {
    const { permissionId } = req.params;
    const { role } = req.body;
    const userRole = req.user.role;

    try {
        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 2: Check if the user's role matches the owner role in the permission
        if (userRole !== permission.owner) {
            return res.status(403).json({ message: "Only the owner role can modify the possible for array" });
        }

        // Step 3: Check if the role is already in possibleForRoles
        if (permission.possibleForRoles.includes(role)) {
            return res.status(400).json({ message: "Role already exists in possibleForRoles" });
        }

        // Step 4: Add the role to possibleForRoles
        permission.possibleForRoles.push(role);
        await permission.save();

        await makeAuditLog(AUDITING.ADD_POSSIBLE_FOR_TO_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, role });

        // Step 5: Respond with success message
        res.status(200).json({ message: "Role added to possibleForRoles successfully", permission });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deletePossibleForRole = async (req, res) => {
    const { permissionId } = req.params;
    const { role } = req.body;
    const userRole = req.user.role; 

    try {
        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);

        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 2: Check if the user's role matches the owner role in the permission
        if (userRole !== permission.owner) {
            return res.status(403).json({ message: "Only the owner role can modify the possibleForRoles array" });
        }

        // Step 3: Check if the role exists in possibleForRoles
        if (!permission.possibleForRoles.includes(role)) {
            return res.status(400).json({ message: "Role does not exist in possibleForRoles" });
        }

        // Step 4: Remove the role from possibleForRoles
        permission.possibleForRoles = permission.possibleForRoles.filter(r => r !== role);
        await permission.save();

        await makeAuditLog(AUDITING.REMOVE_POSSIBLE_FOR_FROM_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, role });

        // Step 5: Respond with success message
        res.status(200).json({ message: "Role removed from possibleForRoles successfully", permission });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const addPossibleGranterRole = async (req, res) => {
    const { permissionId } = req.params;
    const {role}= req.body;
    const userRole = req.user.role;

    try {
        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 3: Check if the user's role matches the owner role in the permission (check granter modification ability)
        if (userRole !== permission.owner) {
            return res.status(403).json({ message: "Only the owner role can modify the granters" });
        }

        // Step 4: Check if the role already exists in possibleGranterRoles
        if (permission.possibleGranterRoles.includes(role)) {
            return res.status(400).json({ message: "Role already exists in possible Granter Roles" });
        }

        // Step 5: Add the role to possibleGranterRoles
        permission.possibleGranterRoles.push(role);
        await permission.save();

        await makeAuditLog(AUDITING.ADD_POSSIBLE_GRANTER_ROLE_TO_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, role });

        res.status(200).json({ message: "Role added to possibleGranterRoles successfully", permission });
    } catch (error) {
        res.status(500).json({ message: "Server error" }); 
    }
};


const deletePossibleGranterRole = async (req, res) => {
    try {
        const { permissionId } = req.params;
        const { role } = req.body; 
        const userRole = req.user.role; 

        // Step 1: Fetch the permission
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }

        // Step 2: Ensure only the owner can modify possibleGranterRoles
        if (userRole !== permission.owner) {
            return res.status(403).json({ message: "Only the owner role can modify possibleGranterRoles" });
        }

        // Step 3: Validate role input
        if (!role) {
            return res.status(400).json({ message: "Role is required in the request body" });
        }

        // Step 4: Check if the role exists in possibleGranterRoles
        if (!permission.possibleGranterRoles.includes(role)) {
            return res.status(400).json({ message: "Role does not exist in possibleGranterRoles" });
        }

        // Step 5: Remove the role from possibleGranterRoles
        permission.possibleGranterRoles = permission.possibleGranterRoles.filter(r => r !== role);
        await permission.save();

        await makeAuditLog(AUDITING.REMOVE_POSSIBLE_GRANTER_ROLE_TO_PERMISSION.action, 200, req.user.id, req.user.role, null, { permissionId, role });

        res.status(200).json({ message: "Role removed from possibleGranterRoles successfully", permission });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const filterPermissions = async (req, res) => {
    try {
        const { name, owner, deleted, granter, possibleGranterRoles, possibleForRoles, usersWithPermission } = req.query;
        const { page = 1, limit = 10 } = req.query; 
        const userOwner = req.user.role; 
        const isAdmin = userOwner.toLowerCase() === "admin"; 

        const filter = {};

        // If the user is an admin, allow them to view all permissions
        if (!isAdmin) {
            // If not admin, only show permissions owned by the user
            filter.owner = userOwner;
        }

        if (name) filter.name = name;
        if (owner) filter.owner = owner;
        if (deleted !== undefined) filter.deleted = deleted === "true"; 
        if (granter) filter.granter = { $in: granter.split(",") }; 
        if (possibleGranterRoles) filter.possibleGranterRoles = { $in: possibleGranterRoles.split(",") };
        if (possibleForRoles) filter.possibleForRoles = { $in: possibleForRoles.split(",") }; 
        if (usersWithPermission) filter.usersWithPermission = { $in: usersWithPermission.split(",") }; 

        const skip = (page - 1) * limit; 
        const permissions = await Permission.find(filter)
            .skip(skip)
            .limit(Number(limit)); 

        const totalCount = await Permission.countDocuments(filter);

        res.status(200).json({
            pagination: {
                totalCount, 
                totalPages: Math.ceil(totalCount / limit), 
                currentPage: Number(page), 
                limit: Number(limit) 
            },
            permissions 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
        });
    }
};

module.exports = {
    createPermission, addGranter, addPossibleGranterRole, deleteGranter, 
    addPossibleForRole, deletePossibleForRole, grantPermission, revokePermission,
    deletePossibleGranterRole, filterPermissions, deletePermission, activatePermission
};