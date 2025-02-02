const Faculty = require("../models/faculty-model");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const createFaculty = async (req, res) => {
    try {
        const {
            id,
            facultyName,
            headId,
            establishedDate,
            address,
            contactDetails,
            departments,
        } = req.body;

        // Check if the faculty already exists
        const existingFaculty = await Faculty.findOne({ _id: id });
        if (existingFaculty) {
            return res.status(400).json({ message: "Faculty with this ID already exists" });
        }

        // Create the faculty
        const faculty = new Faculty({
            _id: id,
            facultyName,
            headId,
            establishedDate,
            address,
            contactDetails,
            departments,
        });

        await faculty.save();

        await makeAuditLog(AUDITING.CREATE_FACULTY.action, 200, req.user.id, req.user.role, null, { id, facultyName });

        res.status(201).json({ message: "Faculty created successfully", faculty });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const getFacultyById = async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findOne({ _id: id, deleted: false });

        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        res.status(200).json({ faculty });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}; 


const updateFaculty = async (req, res) => {
    const { facultyId } = req.params;
    const {
        facultyName,
        headId,
        address,
        phone,
        email,
    } = req.body;

    try {
        // Check if the faculty exists
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        // Update the main faculty fields
        if (facultyName) faculty.facultyName = facultyName;
        if (headId) faculty.headId = headId;
        if (address) faculty.address = address;
        if (phone) faculty.contactDetails.phone = phone;  // Update phone if provided
        if (email) faculty.contactDetails.email = email;  // Update email if provided

        // Save the updated faculty document
        const updatedFaculty = await faculty.save();

        await makeAuditLog(AUDITING.UPDATE_FACULTY.action, 200, req.user.id, req.user.role, null, updatedFaculty);

        res.status(200).json({
            message: "Faculty updated successfully",
            data: updatedFaculty,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};


const softDeleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findOneAndUpdate(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        await makeAuditLog(AUDITING.DELETE_FACULTY.action, 200, req.user.id, req.user.role, null, { facultyId: id });

        res.status(200).json({ message: "Faculty deleted successfully", faculty });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const addDepartmentToFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentId, departmentName, headId, planId } = req.body;

        const faculty = await Faculty.findOne({ _id: id, deleted: false });

        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        // Check if the department already exists
        const existingDepartment = faculty.departments.find(
            (dept) => dept.departmentId === departmentId || dept.departmentName === departmentName
        );

        if (existingDepartment) {
            return res.status(400).json({ message: "Department with this ID or name already exists in the faculty" });
        }

        // Add the department
        faculty.departments.push({
            departmentId,
            departmentName,
            headId,
            planId,
        });

        await faculty.save();

        await makeAuditLog(AUDITING.CREATE_DEPARTMENT.action, 200, req.user.id, req.user.role, null, { departmentId, departmentName });

        res.status(200).json({ message: "Department added successfully", faculty });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const removeDepartmentFromFaculty = async (req, res) => {
    try {
        const { id, departmentId } = req.params;

        const faculty = await Faculty.findOne({ _id: id, deleted: false });

        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        // Check if the department exists
        const departmentExists = faculty.departments.some(
            (dept) => dept.departmentId === departmentId
        );

        if (!departmentExists) {
            return res.status(404).json({ message: "Department not found in the faculty" });
        }

        // Remove the department
        faculty.departments = faculty.departments.filter(
            (dept) => dept.departmentId !== departmentId
        );

        await faculty.save();

        await makeAuditLog(AUDITING.DELETE_DEPARTMENT.action, 200, req.user.id, req.user.role, null, { departmentId });

        res.status(200).json({ message: "Department removed successfully", faculty });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const getFaculties = async (req, res, next) => {
    try {
        const {
            facultyId,
            facultyName,
            deleted,
            departmentId,
            departmentName,
            headId,
            planId,
            establishedDateStart,
            establishedDateEnd,
            address,
            phone,
            email, 
            page = 1, 
            limit = 10
        } = req.query;

        const filter = {};

        if (facultyId) filter._id = facultyId;

        if (facultyName) filter.facultyName = { $regex: facultyName, $options: "i" }; // Case-insensitive search

        if (deleted) filter.deleted = deleted === 'true'; 

        if (departmentId || departmentName || headId || planId) {
            filter.departments = {};
            if (departmentId) filter.departments.$elemMatch = { departmentId: departmentId };
            if (departmentName) filter.departments.$elemMatch = { departmentName: { $regex: departmentName, $options: "i" } };
            if (headId) filter.departments.$elemMatch = { headId: headId };
            if (planId) filter.departments.$elemMatch = { planId: planId };
        }

        if (headId) filter.headId = headId;

        if (establishedDateStart || establishedDateEnd) {
            filter.establishedDate = {};
            if (establishedDateStart) filter.establishedDate.$gte = new Date(establishedDateStart); 
            if (establishedDateEnd) filter.establishedDate.$lte = new Date(establishedDateEnd); 
        }

        if (address) filter.address = { $regex: address, $options: "i" }; 

        if (phone) filter['contactDetails.phone'] = phone;
        if (email) filter['contactDetails.email'] = email;

        const skip = (page - 1) * limit;

        const faculties = await Faculty.find(filter)
            .skip(skip)
            .limit(Number(limit));

        const totalFaculties = await Faculty.countDocuments(filter);

        const totalPages = Math.ceil(totalFaculties / limit);


        res.status(200).json({
            pagination: {
                totalFaculties,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            },
            faculties
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const activateFaculty = async (req, res, next) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findOneAndUpdate(
            { _id: id, deleted: true },
            { deleted: false },
            { new: true }
        );

        if (!faculty) {
            return res.status(404).json({ message:"faculty not found or already active"});
        }

        await makeAuditLog(AUDITING.ACTIVATE_FACULTY.action, 200, req.user.id, req.user.role, null, { facultyId:id });

        res.status(200).json({ message: "faculty activated successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const updateDepartment = async (req, res) => {
    const { facultyId } = req.params;
    const {
        departmentId,
        departmentName,
        headId,
        planId,
        previousPlans,
        deleted,
    } = req.body;

    try {
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        const department = faculty.departments.find(
            (dept) => dept.departmentId === departmentId
        );
        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }

        if (departmentName) department.departmentName = departmentName;
        if (headId) department.headId = headId;
        if (planId) department.planId = planId;
        if (previousPlans) department.previousPlans = previousPlans;
        if (deleted !== undefined) department.deleted = deleted;

        const updatedFaculty = await faculty.save();

        await makeAuditLog(AUDITING.UPDATE_DEPARTMENT.action, 200, req.user.id, req.user.role, null, { departmentId });

        res.status(200).json({
            message: "Department updated successfully",
            data: updatedFaculty,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createFaculty, getFaculties, getFacultyById, softDeleteFaculty, addDepartmentToFaculty, 
    removeDepartmentFromFaculty, activateFaculty, updateFaculty, updateDepartment
};