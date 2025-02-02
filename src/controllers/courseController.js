const Course = require("../models/course-model");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const createCourse = async (req, res) => {
    const {
        id,
        name,
        credits,
        description,
        audience,
        departmentId,
        facultyId,
        prerequisites,
    } = req.body;

    try {

        // Check if the course already exists
        const existingCourse = await Course.findOne({ _id: id });
        if (existingCourse) {
            return res.status(400).json({ message: "Course with this ID already exists" });
        }

        // Validate audience-specific fields
        if (audience === "Department-Specific" && !departmentId) {
            return res.status(400).json({ message: "Department ID is required for Department-Specific courses" });
        }
        if (audience === "Faculty-Wide" && !facultyId) {
            return res.status(400).json({ message: "Faculty ID is required for Faculty-Wide courses" });
        }

        const course = new Course({
            _id: id,
            name,
            credits,
            description,
            audience,
            departmentId,
            facultyId,
            prerequisites,
        });

        await course.save();

        await makeAuditLog(AUDITING.CREATE_COURSE.action, 201, req.user.id, req.user.role, null, {courseId:id});

        res.status(201).json({ message: "Course created successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, deleted: false });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({ course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const allowedFields = ["name", "credits", "description"];

        // Filter updateData to include only allowed fields
        const filteredUpdateData = {};
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredUpdateData[key] = updateData[key];
            }
        }

        if (Object.keys(filteredUpdateData).length === 0) {
            return res.status(200).json({ message: "No changes made" });
        }

        const course = await Course.findOneAndUpdate(
            { _id: id, deleted: false }, // Ensure the course is not deleted
            filteredUpdateData, 
            { new: true } 
        );

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        await makeAuditLog(AUDITING.UPDATE_COURSE.action, 200, req.user.id, req.user.role, null, filteredUpdateData);

        res.status(200).json({ message: "Course updated successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const softDeleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findOneAndUpdate(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        await makeAuditLog(AUDITING.DELETE_COURSE.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Course deleted successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

const activateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findOneAndUpdate(
            { _id: id, deleted: true }, 
            { deleted: false },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: "Course not found or already active" });
        }

        await makeAuditLog(AUDITING.ACTIVATE_COURSE.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Course activated successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

const getNonActiveCourses = async (req, res) => {
    try {
        const nonActiveCourses = await Course.find({ deleted: true });

        if (nonActiveCourses.length === 0) {
            return res.status(200).json({ message: "No non-active courses found" });
        }

        res.status(200).json({
            success: true,
            count: nonActiveCourses.length,
            data: nonActiveCourses,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const addPrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        const { prerequisiteId } = req.body;

        const course = await Course.findOne({ _id: id, deleted: false });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (course.prerequisites.includes(prerequisiteId)) {
            return res.status(400).json({ message: "Prerequisite already exists for this course" });
        }

        const prerequisiteExists = await Course.exists({ _id: prerequisiteId, deleted: false });

        if (!prerequisiteExists) {
            return res.status(404).json({ message: "Prerequisite not found" });
        }

        course.prerequisites.push(prerequisiteId);
        await course.save();

        await makeAuditLog(AUDITING.ADD_PREREQUISITE.action, 200, req.user.id, req.user.role, null, { courseId: id, prerequisiteId });

        res.status(200).json({ message: "Prerequisite added successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const removePrerequisite = async (req, res) => {
    try {
        const { id, prerequisiteId } = req.params;

        const course = await Course.findOne({ _id: id, deleted: false });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const numberOfPrerequisitesBefore = course.prerequisites.length;

        course.prerequisites = course.prerequisites.filter(
            (prereq) => prereq.toString() !== prerequisiteId
        );

        if (numberOfPrerequisitesBefore === course.prerequisites.length) {
            return res.status(404).json({ message: "Prerequisite not found" });
        }

        await course.save();

        await makeAuditLog(AUDITING.DELETE_PREREQUISITE.action, 200, req.user.id, req.user.role, null, { courseId: id, prerequisiteId });

        res.status(200).json({ message: "Prerequisite removed successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const getCourses = async (req, res, next) => {
    try {
        const { name, credits, audience, departmentId, facultyId, page = 1, limit = 10 } = req.query;

        const filter = { deleted: false };

        if (name) filter.name = { $regex: name, $options: "i" }; 
        if (credits) filter.credits = Number(credits);
        if (audience) filter.audience = audience;
        if (departmentId) filter.departmentId = departmentId;
        if (facultyId) filter.facultyId = facultyId;

        const skip = (page - 1) * limit;

        const courses = await Course.find(filter)
            .skip(skip)
            .limit(Number(limit));

        const totalCourses = await Course.countDocuments(filter);

        const totalPages = Math.ceil(totalCourses / limit);

        res.status(200).json({
            pagination: {
                totalCourses,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            },
            courses
        });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

module.exports = {
    createCourse, getCourseById, updateCourse, softDeleteCourse,
    activateCourse, getNonActiveCourses, addPrerequisite, removePrerequisite, 
    getCourses
};