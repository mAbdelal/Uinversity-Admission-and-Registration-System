const Student = require("../models/student-model");
const bcrypt = require("bcryptjs");
const Counter=require('../models/counter-model');
const fs = require('fs').promises;
const path = require('path');
const Class = require("../models/class-model");
const Semester = require("../models/semester-model");
const Enrollment = require("../models/enrollment-model");
const Course = require("../models/course-model");
const getCoursesByPlanIdAPI = require("../fackExternalAPIs/planAPI");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");


const getStudents = async (req, res, next) => {
    try {
        const {
            studentId,
            firstName,
            secondName,
            thirdName,
            lastName,
            dateOfBirthStart,
            dateOfBirthEnd,
            socialStatus,
            GPA,
            gender,
            status,
            level,
            nationality,
            studyingDegree,
            facultyId,
            departmentId,
            planId,
            deleted,
            idDocumentType,
            idDocumentNumber,
            address,
            phone,
            email,
            createdAtStart,
            createdAtEnd,
            updatedAtStart,
            updatedAtEnd,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (studentId) filter._id = studentId;

        if (firstName) filter.firstName = { $regex: firstName, $options: "i" };
        if (secondName) filter.secondName = { $regex: secondName, $options: "i" };
        if (thirdName) filter.thirdName = { $regex: thirdName, $options: "i" };
        if (lastName) filter.lastName = { $regex: lastName, $options: "i" };

        if (dateOfBirthStart || dateOfBirthEnd) {
            filter.dateOfBirth = {};
            if (dateOfBirthStart) filter.dateOfBirth.$gte = new Date(dateOfBirthStart); 
            if (dateOfBirthEnd) filter.dateOfBirth.$lte = new Date(dateOfBirthEnd); 
        }

        if (socialStatus) filter.socialStatus = socialStatus;

        if (GPA) filter.GPA = Number(GPA); 

        if (gender) filter.gender = gender;

        if (status) filter.status = status;

        if (level) filter.level = Number(level); 

        if (nationality) filter.nationality = nationality;

        if (studyingDegree) filter.studyingDegree = studyingDegree;

        if (facultyId) filter['faculty.facultyId'] = facultyId;

        if (departmentId) filter['department.departmentId'] = departmentId;

        if (planId) filter.planId = planId;

        if (deleted) filter.deleted = deleted === 'true';

        if (idDocumentType) filter['idDocument_details.idDocumentType'] = idDocumentType;
        if (idDocumentNumber) filter['idDocument_details.idDocumentNumber'] = idDocumentNumber;

        if (address) filter['contact_details.address'] = { $regex: address, $options: "i" }; 
        if (phone) filter['contact_details.phone'] = phone;
        if (email) filter['contact_details.email'] = email;

        if (createdAtStart || createdAtEnd) {
            filter.createdAt = {};
            if (createdAtStart) filter.createdAt.$gte = new Date(createdAtStart); 
            if (createdAtEnd) filter.createdAt.$lte = new Date(createdAtEnd); 
        }

        if (updatedAtStart || updatedAtEnd) {
            filter.updatedAt = {};
            if (updatedAtStart) filter.updatedAt.$gte = new Date(updatedAtStart); 
            if (updatedAtEnd) filter.updatedAt.$lte = new Date(updatedAtEnd); 
        }

        const skip = (page - 1) * limit;

        const students = await Student.find(filter)
            .skip(skip)
            .limit(Number(limit));

        const totalStudents = await Student.countDocuments(filter);
        
        const totalPages = Math.ceil(totalStudents / limit);

        res.status(200).json({
            pagination: {
                totalStudents,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            },
            students
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};


const createStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            status,
            nationality,
            studyingDegree,
            faculty,
            department,
            planId,
            contact_details,
            idDocument_details,
            previousDegrees,
        } = req.body;

        // Generate a random 5-digit password
        const randomPassword = Math.floor(10000 + Math.random() * 90000);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword.toString(), salt);

        // Generate the student ID
        const year = new Date().getFullYear();
        const counterId = `student-${year}`;

        const counter = await Counter.findByIdAndUpdate(
            { _id: counterId },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );

        const studentId = `S${year}${String(counter.sequence).padStart(4, '0')}`; // Format: S202300001

        const student = new Student({
            _id: studentId,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            status,
            nationality,
            studyingDegree,
            faculty,
            department,
            planId,
            password: hashedPassword,
            contact_details,
            idDocument_details,
            previousDegrees,
            level: 1,
        });

        await student.save();

        await makeAuditLog(AUDITING.CREATE_STUDENT.action, 201, req.user.id, req.user.role, null, { studentId });

        res.status(201).json({
            message: 'Student created successfully',
            student,
            plainPassword: randomPassword,
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ _id: id, deleted: false }).select("-password");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({ student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const updateAllStudentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            secondName,
            thirdName,
            lastName,
            dateOfBirth,
            socialStatus,
            gender,
            status,
            nationality,
            address,
            phone,
            email
        } = req.body;

        const updateData = {};

        if (firstName) updateData.$set = { ...updateData.$set, firstName };
        if (secondName) updateData.$set = { ...updateData.$set, secondName };
        if (thirdName) updateData.$set = { ...updateData.$set, thirdName };
        if (lastName) updateData.$set = { ...updateData.$set, lastName };
        if (dateOfBirth) updateData.$set = { ...updateData.$set, dateOfBirth };
        if (socialStatus) updateData.$set = { ...updateData.$set, socialStatus };
        if (gender) updateData.$set = { ...updateData.$set, gender };
        if (status) updateData.$set = { ...updateData.$set, status };
        if (nationality) updateData.$set = { ...updateData.$set, nationality };

        if (address) updateData.$set = { ...updateData.$set, "contact_details.address": address };
        if (phone) updateData.$set = { ...updateData.$set, "contact_details.phone": phone };
        if (email) updateData.$set = { ...updateData.$set, "contact_details.email": email };

        const student = await Student.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            { new: true }
        ).select("-password");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        await makeAuditLog(AUDITING.UPDATE_STUDENT.action, 200, req.user.id, req.user.role, null, { studentId: id });

        res.status(200).json({ message: "Student updated successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const updateStudentBasicInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { address, phone, email } = req.body; 

        if (id !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this student." });
        }

        let updateData = {};

        if (address) updateData.$set = { ...updateData.$set, "contact_details.address": address };
        if (phone) updateData.$set = { ...updateData.$set, "contact_details.phone": phone };
        if (email) updateData.$set = { ...updateData.$set, "contact_details.email": email };

        const student = await Student.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            { new: true }
        ).select("-password");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({ message: "Student contact details updated successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const replaceIdDocument = async (req, res) => {
    const { studentId } = req.params;
    const { idDocumentType, idDocumentNumber } = req.body;
    const idDocumentPath = req.file ? req.file.filename : null; 

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (!idDocumentPath) {
            return res.status(400).json({ message: "ID document file is required" });
        }

        student.idDocument_details = {
            idDocumentPath,
            idDocumentType,
            idDocumentNumber,
        };

        await student.save();

        await makeAuditLog(AUDITING.UPDATE_STUDENT.action, 200, req.user.id, req.user.role, null, { studentId: id, idDocument_details: student.idDocument_details });

        res.status(200).json({ message: "ID document added successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};

const addPreviousDegree = async (req, res) => {
    const { studentId } = req.params; 
    const { type, GPA } = req.body; 
    const transcriptPath = req.files && req.files.transcript ? req.files.transcript[0].filename : null; // Get transcript file path from multer
    const certificatePath = req.files && req.files.certificate ? req.files.certificate[0].filename : null; // Get certificate file path from multer

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (!transcriptPath || !certificatePath) {
            return res.status(400).json({ message: "Both transcript and certificate files are required" });
        }

        const newDegree = {
            type,
            GPA,
            transcriptPath,
            certificatePath,
        };

        student.previousDegrees.push(newDegree);

        await student.save();

        await makeAuditLog(AUDITING.UPDATE_STUDENT.action, 200, req.user.id, req.user.role, null, { studentId, newDegree });

        res.status(200).json({
            message: "Previous degree added successfully",
            student,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};

const removePreviousDegree = async (req, res) => {
    const { studentId, degreeId } = req.params;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const degreeIndex = student.previousDegrees.findIndex(degree => degree._id.toString() === degreeId);
        if (degreeIndex === -1) {
            return res.status(404).json({ message: "Degree not found" });
        }

        const degreeToRemove = student.previousDegrees[degreeIndex];
        const transcriptPath = path.join(__dirname, '..', '..', 'uploads', degreeToRemove.transcriptPath);
        const certificatePath = path.join(__dirname, '..', '..', 'uploads', degreeToRemove.certificatePath);

        // Remove the degree from the previousDegrees array
        student.previousDegrees.splice(degreeIndex, 1);

        // Delete the associated files from the filesystem asynchronously
        await fs.unlink(transcriptPath); 
        await fs.unlink(certificatePath); 

        await student.save();

        await makeAuditLog(AUDITING.UPDATE_STUDENT.action, 200, req.user.id, req.user.role, null, {  studentId, removedDegreeId:degreeId });

        res.status(200).json({
            message: "Previous degree and associated files removed successfully",
            student,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findOneAndUpdate(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        ).select("-password");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        await makeAuditLog(AUDITING.DELETE_STUDENT.action, 200, req.user.id, req.user.role, null, { studentId: id});

        res.status(200).json({ message: "Student deleted successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};



const sendNotificationToStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { title, body } = req.body;
        const sender=req.user.id;


        const student = await Student.findOne({ _id: studentId, deleted: false });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        student.notifications.push({
            title,
            body,
            sender,
        });

        await student.save();

        res.status(200).json({ message: "Notification sent successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteNotificationById = async (req, res) => {
    const { studentId, notificationId } = req.params;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found. Please check the provided studentId." });
        }

        const notificationIndex = student.notifications.findIndex(
            (notification) => notification._id.toString() === notificationId
        );

        if (notificationIndex === -1) {
            return res.status(404).json({ message: "Notification not found. Please check the provided notificationId." });
        }

        student.notifications.splice(notificationIndex, 1);

        await student.save();

        res.status(200).json({
            message: "Notification deleted successfully.",
            data: { studentId, notificationId }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

const deleteAllNotifications = async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        student.notifications = [];

        await student.save();

        res.status(200).json({ message: "All notifications deleted successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};

const getAllNotifications = async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const notifications = student.notifications;

        res.status(200).json({ message: "Notifications fetched successfully", notifications });
    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};

const getAvailableClassesForStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Step 1: Get the student's planId from the Student model
        const student = await Student.findById(studentId).exec();
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const planId = student.planId;

        // Step 2: Get the current semester
        const currentSemester = await Semester.getCurrentSemester();
        if (!currentSemester) {
            return res.status(404).json({ message: "Current semester not found" });
        }

        // Step 3: Get the courses for the student's plan using getCoursesByPlanIdAPI()
        const planCourses = await getCoursesByPlanIdAPI(planId);
        if (!planCourses || Object.keys(planCourses).length === 0) {
            return res.status(404).json({ message: "No courses found for the student's plan" });
        }

        // Step 4: Initialize caches and results arrays
        const finishedCourses = new Set();
        const availableClasses = [];
        const availableLabs = [];
        const availableElectiveSets = [];

        // Step 5: Convert semesters to an array and iterate in reverse order
        const semesters = Object.values(planCourses);
        for (let i = semesters.length - 1; i >= 0; i--) {
            const semesterCourses = semesters[i];

            // Process regular courses
            for (const course of semesterCourses.courses) {
                if (course.courseId) {
                    // Step 5.1: Check if the course is available in the current semester
                    const courseClass = await Class.findOne({
                        "courseDetails.courseId": course.courseId,
                        semesterId: currentSemester
                    }).lean();

                    if (!courseClass) {
                        continue;
                    }

                    // Step 5.2: Check if the course has prerequisites
                    if (course.prerequisites?.length > 0) {
                        const prerequisitesCompleted = await checkPrerequisites(studentId, course.prerequisites, finishedCourses);
                        if (!prerequisitesCompleted) {
                            continue;
                        }
                    }

                    // Add the class to the available classes list
                    availableClasses.push({
                        classId: courseClass._id,
                        courseDetails: courseClass.courseDetails,
                        name: courseClass.name,
                        roomId: courseClass.roomId,
                        appointments: courseClass.appointments,
                        instructorDetails: courseClass.instructorDetails,
                        status: courseClass.status
                    });
                } else if (course.electiveSet) {
                    // Process elective sets
                    const electiveSet = {
                        electiveSet: course.electiveSet,
                        classes: [],
                    };

                    for (const electiveCourse of course.courses) {
                        const electiveClass = await Class.findOne({
                            "courseDetails.courseId": electiveCourse.courseId,
                            semesterId: currentSemester
                        }).lean();

                        if (!electiveClass) {
                            continue;
                        }

                        if (electiveCourse.prerequisites?.length > 0) {
                            const prerequisitesCompleted = await checkPrerequisites(studentId, electiveCourse.prerequisites, finishedCourses);
                            if (!prerequisitesCompleted) {
                                continue;
                            }
                        }

                        electiveSet.classes.push({
                            classId: electiveClass._id,
                            courseDetails: electiveClass.courseDetails,
                            name: electiveClass.name,
                            roomId: electiveClass.roomId,
                            appointments: electiveClass.appointments,
                            instructorDetails: electiveClass.instructorDetails,
                            status: electiveClass.status
                        });
                    }

                    if (electiveSet.classes.length > 0) {
                        availableElectiveSets.push(electiveSet);
                    }
                }
            }

            // Process labs
            for (const lab of semesterCourses.labs) {
                const labClass = await Class.findOne({
                    "courseDetails.courseId": lab.labId,
                    semesterId: currentSemester
                }).lean();

                if (!labClass) {
                    continue;
                }

                const labCourse = await Course.findById(lab.labId).exec();
                if (labCourse.prerequisites?.length > 0) {
                    const prerequisitesCompleted = await checkPrerequisites(studentId, labCourse.prerequisites, finishedCourses);
                    if (!prerequisitesCompleted) {
                        continue;
                    }
                }

                availableLabs.push({
                    classId: labClass._id,
                    courseDetails: labClass.courseDetails,
                    name: labClass.name,
                    roomId: labClass.roomId,
                    appointments: labClass.appointments,
                    instructorDetails: labClass.instructorDetails,
                    status: labClass.status
                });
            }
        }

        // Step 6: Return the filtered list of available classes
        res.status(200).json({
            availableClasses,
            availableLabs,
            availableElectiveSets,
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error"});
    }
};


const checkPrerequisites = async (studentId, prerequisites, finishedCourses) => {
    for (const prerequisiteCourseId of prerequisites) {
        if (finishedCourses.has(prerequisiteCourseId)) {
            continue; 
        }

        // If the prerequisite isn't in the Set, check completion in the database
        const enrollment = await Enrollment.findOne({
            studentId,
            courseId: prerequisiteCourseId,
            "grades.total": { $gte: 60 },
        }).exec();

        if (!enrollment) {
            return false; 
        }

        finishedCourses.add(prerequisiteCourseId);

        // if the course is completed, all its prerequisites are also considered completed
        const course = await CourseSchema.findById(prerequisiteCourseId).exec();
        if (course && course.prerequisites && course.prerequisites.length > 0) {
            for (const coursePrerequisite of course.prerequisites) {
                finishedCourses.add(coursePrerequisite);
            }
        }
    }

    return true; // All prerequisites are completed (either checked or assumed completed)
};



module.exports = {
    getStudents, getStudentById, deleteStudent, createStudent, updateAllStudentInfo, 
    updateStudentBasicInfo, replaceIdDocument, addPreviousDegree, removePreviousDegree, 
    sendNotificationToStudent, deleteNotificationById, deleteAllNotifications, getAllNotifications,
    getAvailableClassesForStudent
};