const Class = require("../models/class-model");
const Semester = require("../models/semester-model");
const Employee = require("../models/employee-model");
const Enrollment = require("../models/enrollment-model");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const createClass = async (req, res) => {
    try {
        const {
            courseDetails: { courseId, name: courseName, credits },
            name: className,
            roomId,
            appointments,
            instructorDetails,
        } = req.body;

        const currentSemester = await Semester.getCurrentSemester();

        if (!currentSemester) {
            return res.status(400).json({ message: "No active semester found" });
        }

        // Check if the class already exists
        const existingClass = await Class.findOne({
            semesterId: currentSemester,
            "courseDetails.courseId": courseId,
            name: className ?? "101"
        });

        if (existingClass) {
            return res.status(400).json({ message: "Class with the same course, semester, and name already exists" });
        }

        const newClass = new Class({
            courseDetails: {
                courseId,
                name: courseName,
                credits,
            },
            semesterId: currentSemester,
            name: className,
            roomId,
            appointments,
            instructorDetails,
        });

        await newClass.save();

        await makeAuditLog(AUDITING.CREATE_CLASS.action, 201, req.user.id, req.user.role, null, { courseName, className });

        res.status(201).json({ message: "Class created successfully", class: newClass });
    } catch (error) {
        await makeAuditLog(AUDITING.CREATE_CLASS.action, 500, req.user.id, req.user.role, error.message, { courseName, className });
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getClasses = async (req, res) => {
    try {
        const {
            courseId,
            courseName,
            credits,
            semesterId,
            className,
            roomId,
            lock,
            day,
            startTime,
            endTime,
            instructorId,
            instructorName,
            page = 1, 
            limit = 10  
        } = req.query;

        const pageNumber = Math.max(1, Number(page));
        const pageSize = Math.max(1, Number(limit));
        const skip = (pageNumber - 1) * pageSize;

        // Build the filter object dynamically
        const filter = {};

        if (courseId) filter['courseDetails.courseId'] = courseId;
        if (courseName) filter['courseDetails.name'] = { $regex: courseName, $options: "i" }; // Case-insensitive search
        if (credits) filter['courseDetails.credits'] = Number(credits); 

        if (semesterId) filter.semesterId = semesterId;

        if (className) filter.name = { $regex: className, $options: "i" }; 

        if (roomId) filter.roomId = roomId;

        if (lock) filter.lock = lock === 'true'; 

        if (day) filter['appointments.day'] = day;
        if (startTime) filter['appointments.startTime'] = startTime;
        if (endTime) filter['appointments.endTime'] = endTime;

        if (instructorId) filter['instructorDetails.instructorId'] = instructorId;
        if (instructorName) filter['instructorDetails.instructorName'] = { $regex: instructorName, $options: "i" }; 

        const totalClasses = await Class.countDocuments(filter); 
        const classes = await Class.find(filter)
            .skip(skip) 
            .limit(pageSize); 

        res.status(200).json({
            totalClasses, 
            totalPages: Math.ceil(totalClasses / pageSize), 
            currentPage: pageNumber,
            pageSize,
            classes
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const updateClass = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { name, roomId, instructorId } = req.body;

        const existingClass = await Class.findById(id);
        if (!existingClass) {
            throw new ApiError(404, "Class not found");
        }

        if (name && name !== existingClass.name) {
            const currentSemester = existingClass.semesterId;
            const className = name; 

            const duplicateClass = await Class.findOne({
                semesterId: currentSemester,
                "courseDetails.courseId": existingClass.courseDetails.courseId,
                name: className,
            });

            if (duplicateClass) {
                return res.status(400).json({
                    message: "Class with the same course, semester, and name already exists",
                });
            }
        }

        const updateData = {};

        // Handle instructor update if the instructorId has changed
        if (instructorId && instructorId !== existingClass.instructorDetails.instructorId) {
            const instructor = await Employee.findById(instructorId);
            if (!instructor) {
                throw new ApiError(404, "Instructor not found");
            }

            updateData.instructorDetails = {
                instructorId,
                instructorName: `${instructor.firstName} ${instructor.lastName}`,
            };
        } 

        if (name) updateData.name = name;
        if (roomId) updateData.roomId = roomId;

        const classData = await Class.findOneAndUpdate(
            { _id: id },
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Class updated successfully", class: classData });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const deleteClass = async (req, res) => {
    const { id } = req.params;
    try {

        const currentSemester = await Semester.getCurrentSemester();

        // Find the class by ID and check if it's in the current semester
        const classData = await Class.findOne({ _id: id, semesterId: currentSemester });

        if (!classData) {
            return res.status(404).json({ message: "Class not found in the current semester" });
        }

        if (classData.status === "final") {
            return res.status(400).json({ message: "Class status is final and cannot be deleted" });
        }

        await Enrollment.deleteMany({ classId: id });

        await Class.findOneAndDelete({ _id: id });

        await makeAuditLog(AUDITING.DELETE_CLASS.action, 200, req.user.id, req.user.role, null, { classId: id });

        res.status(200).json({ message: "Class and related enrollments deleted successfully", class: classData });
    } catch (error) {
        await makeAuditLog(AUDITING.DELETE_CLASS.action, 500, req.user.id, req.user.role, error.message, { classId:id });
        return res.status(500).json({ message: "Internal server error" });
    }
};

const changeClassesStatus = async (req, res) => {
    const { status } = req.body; 
    try {

        if (!['temporary', 'final'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const currentSemester = await Semester.getCurrentSemester();

        if (!currentSemester) {
            return res.status(400).json({ message: "No active semester found" });
        }

        const updatedClasses = await Class.updateMany(
            { semesterId: currentSemester },
            {
                $set: {
                    status,
                    lock: true 
                }
            }
        );

        await makeAuditLog(AUDITING.CHANGE_CLASSES_STATUS.action, 200, req.user.id, req.user.role, null, { status });

        res.status(200).json({
            message: `Classes status updated to ${status} and classes are locked.`,
            updatedClasses,
        });
    } catch (error) {
        await makeAuditLog(AUDITING.CHANGE_CLASSES_STATUS.action, 500, req.user.id, req.user.role, error.message, { status });
        return res.status(500).json({ message: "Internal server error" });
    }
};

const addAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { day, startTime, endTime } = req.body;

        if (!["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].includes(day)) {
            return res.status(400).json({ message: "Invalid day of the week" });
        }
        if (!startTime || !endTime) {
            return res.status(400).json({ message: "Start time and End time are required" });
        }

        const classData = await Class.findById(id);
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        classData.appointments.push({
            day,
            startTime,
            endTime,
        });

        await classData.save();

        res.status(200).json({
            message: "Appointment added successfully",
            class: classData,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const deleteAppointment = async (req, res, next) => {
    try {
        const { id, appointmentId } = req.params; 

        const classData = await Class.findById(id);
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        const appointmentIndex = classData.appointments.findIndex(
            (appointment) => appointment._id.toString() === appointmentId
        );

        if (appointmentIndex === -1) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Remove the appointment
        classData.appointments.splice(appointmentIndex, 1);

        await classData.save();

        res.status(200).json({
            message: "Appointment deleted successfully",
            class: classData,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const lockClass = async (req, res, next) => {
    try {
        const { id } = req.params; 

        const classData = await Class.findById(id);
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        classData.lock = true;
        await classData.save();

        res.status(200).json({
            message: "Class has been locked",
            class: classData,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const unlockClass = async (req, res, next) => {
    try {
        const { id } = req.params; 

        const classData = await Class.findById(id);
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }

        classData.lock = false;
        await classData.save();

        res.status(200).json({
            message: "Class has been unlocked",
            class: classData,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { createClass, getClasses, updateClass, deleteClass, 
    changeClassesStatus, deleteAppointment, addAppointment, lockClass, 
    unlockClass
}