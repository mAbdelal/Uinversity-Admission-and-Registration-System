const Class = require("../models/class-model");
const Semester = require("../models/semester-model");
const Enrollment = require("../models/enrollment-model");
const Student = require("../models/student-model");
const Course = require("../models/course-model");
const getCoursesByPlanIdAPI=require("../fackExternalAPIs/planAPI");

const isOperationAllowedForStudent = async () =>{
    try {
        const currentSemester = await Semester.getCurrentSemesterData();

        if (!currentSemester) {
            return false;
        }

        const now = new Date();

        // Check if the current date is within the semester's start and end dates
        if (
            now >= currentSemester.schedule.enrollmentStartDate &&
            now <= currentSemester.schedule.enrollmentEndDate
        ) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error("Failed to check semester validity.");
    }
};

const deleteEnrollment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userType } = req.user; 

        const enrollment = await Enrollment.findById(id)
            .populate({
                path: 'classId',
                select: 'semesterId lock' 
            });

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        // Check if the enrollment belongs to the current semester
        const currentSemester = await Semester.getCurrentSemester(); 
        if (!currentSemester || enrollment.classId.semesterId !== currentSemester) {
            return res.status(403).json({ message: "Enrollment does not belong to the current semester" });
        }

        // Check if the user is a student and if the enrollment is locked
        if (userType.toLowerCase() === 'student') {

            if (enrollment.classId.lock) {
                return res.status(403).json({ message: "Class is locked. Cannot delete enrollment." });
            }

            if (enrollment.lock) {
                return res.status(403).json({ message: "Enrollment is locked. Cannot delete." });
            }

            const isAllowed = await isOperationAllowedForStudent(); 

            if (!isAllowed) {
                return res.status(403).json({ message: "Operation not allowed in the current semester" });
            }
        }

        const deletedEnrollment = await Enrollment.findByIdAndDelete(id);

        res.status(200).json({ message: "Enrollment deleted successfully", enrollment: deletedEnrollment });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const updateGrades = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { activities, midterm, lab, final } = req.body;
        const { role } = req.user;
        const instructorId = req.user.id;

        const enrollment = await Enrollment.findOne({ _id: id }).populate({
            path: 'classId',
            select: 'instructorDetails', 
        });

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        // Ensure the user is an instructor and is assigned to the class
        if (role.toLowerCase() === "instructor") {
            if (enrollment.classId.instructorDetails.instructorId !== instructorId) {
                return res.status(403).json({ message: "You are not the instructor for this class." });
            }
        }

        const newTotal =
            (activities || enrollment.grades.activities) +
            (midterm || enrollment.grades.midterm) +
            (lab || enrollment.grades.lab) +
            (final || enrollment.grades.final);

        if (newTotal > 100) {
            return res.status(400).json({ message: "Total grade cannot exceed 100." });
        }

        enrollment.grades.activities = activities || enrollment.grades.activities;
        enrollment.grades.midterm = midterm || enrollment.grades.midterm;
        enrollment.grades.lab = lab || enrollment.grades.lab;
        enrollment.grades.final = final || enrollment.grades.final;
        enrollment.grades.total = newTotal;

        await enrollment.save();

        res.status(200).json({ message: "Grades updated successfully", enrollment });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const lockEnrollment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findOne({ _id: id });

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        enrollment.lock = true;
        await enrollment.save();

        res.status(200).json({ message: "Enrollment locked successfully", enrollment });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const unlockEnrollment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findOne({ _id: id });

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        enrollment.lock = false;
        await enrollment.save();

        res.status(200).json({ message: "Enrollment unlocked successfully", enrollment });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const updateEnrollmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isCapstone, isIncomplete, isWithdrawn } = req.body;

        const enrollment = await Enrollment.findById(id);
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        if (isCapstone !== undefined) {
            enrollment.isCapstone = isCapstone === 'true' || isCapstone === true;
        }
        if (isIncomplete !== undefined) {
            enrollment.isIncomplete = isIncomplete === 'true' || isIncomplete === true;
        }
        if (isWithdrawn !== undefined) {
            enrollment.isWithdrawn = isWithdrawn === 'true' || isWithdrawn === true;
        }

        await enrollment.save();

        res.status(200).json({ message: "Enrollment status updated successfully", enrollment });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const enrollInClass = async (req, res) => {
    try {
        const { studentId, classId } = req.body;
        const isCapstone = req.user.role.toLowerCase() !== "student" ? req.body.isCapstone : undefined;
        const lock = req.user.role.toLowerCase() !== "student" ? req.body.lock ?? true : false; 

        // Step 1: Ensure the user is a student and check if operation is allowed
        if (req.user.role.toLowerCase() === "student") {
            const isAllowed = await isOperationAllowedForStudent();
            if (!isAllowed) {
                return res.status(403).json({ message: "Enrollment is not allowed for students at this time" });
            }
        }

        // Step 2: Ensure the student is not already enrolled in the class
        const existingEnrollment = await Enrollment.findOne({ studentId, classId }).exec();
        if (existingEnrollment) {
            return res.status(400).json({ message: "Student is already enrolled in this class" });
        }

        // Step 3: Get the current semester data
        const currentSemester = await Semester.getCurrentSemesterData();
        if (!currentSemester) {
            return res.status(404).json({ message: "Current semester not found" });
        }

        const currentSemesterId = currentSemester._id;

        // Step 4: Build the query conditionally based on user role
        const classQuery = {
            _id: classId,
            semesterId: currentSemesterId
        };

        // If the role is student, add lock: false to prevent enrollment in locked classes
        if (req.user.role.toLowerCase() === "student") {
            classQuery.lock = false;
        }

        // Fetch class details with the constructed query
        const classDetails = await Class.findOne(classQuery).exec();

        if (!classDetails) {
            return res.status(404).json({ message: "Class not found or restricted for enrollment" });
        }

        // Step 5: Fetch student information
        const student = await Student.findById(studentId).exec();
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const { planId } = student;

        // Step 6: Get the courses from the student's academic plan
        const planCourses = await getCoursesByPlanIdAPI(planId);
        if (!planCourses || Object.keys(planCourses).length === 0) {
            return res.status(404).json({ message: "No courses found for the student's plan" });
        }

        // Step 7: Check if the course belongs to the student's plan
        let courseInPlan = false;

        for (const semester of Object.values(planCourses)) {
            const courseFoundInCourses = semester.courses.some(course => {
                if (course.electiveSet) {
                    return course.courses.some(e => e.courseId === classDetails.courseDetails.courseId);
                } else {
                    return course.courseId === classDetails.courseDetails.courseId;
                }
            });

            if (courseFoundInCourses) {
                courseInPlan = true;
                break; // Stop checking further if the course is found in courses
            }

            // Check in labs only if the course was not found in courses
            const courseFoundInLabs = semester.labs.some(lab => lab.labId === classDetails.courseDetails.courseId);
            if (courseFoundInLabs) {
                courseInPlan = true;
                break; // Stop checking further if the course is found in labs
            }
        }

        // Step 8: Verify if the course belongs to the student's plan
        if (!courseInPlan) {
            return res.status(400).json({ message: "Course is not in the student's plan" });
        }

        // Step 9: Check prerequisites
        const course = await Course.findById(classDetails.courseDetails.courseId).exec();
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (course.prerequisites && course.prerequisites.length > 0) {
            const prerequisitesCompleted = await checkPrerequisites(studentId, course.prerequisites);
            if (!prerequisitesCompleted) {
                return res.status(400).json({ message: "Prerequisites not completed" });
            }
        }

        // Step 10: Determine enrollment fields for enroller and lock
        const enroller = req.user.role.toLowerCase() === "student" ? "student" : "employee";
        const enrollerId = req.user.id;

        // Step 11: Create and save the enrollment
        const newEnrollment = new Enrollment({
            studentId,
            classId,
            courseId: classDetails.courseDetails.courseId,
            enroller: enroller,
            enrollerId: enrollerId,
            isCapstone: isCapstone,   
            lock: lock,
            "grades.total":0               
        });

        await newEnrollment.save();
        res.status(201).json({ message: "Enrollment successful", enrollment: newEnrollment });

    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const checkPrerequisites = async (studentId, prerequisites) => {
    for (const prerequisiteCourseId of prerequisites) {
        const enrollment = await Enrollment.findOne({
            studentId,
            courseId: prerequisiteCourseId,
            "grades.total": { $gte: 60 }, 
        }).exec();

        if (!enrollment) {
            return false; 
        }
    }
    return true; 
};


const getStudentEnrollments = async (req, res) => {
    try {
        // Step 1: Get the studentId from request parameters
        const { studentId } = req.params;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Step 2: Get the current semester data using Semester.getCurrentSemesterData()
        const currentSemesterData = await Semester.getCurrentSemesterData();
        if (!currentSemesterData) {
            return res.status(404).json({ message: "Current semester data not found" });
        }

        const startDate = currentSemesterData.schedule.startDate;
        const endDate = currentSemesterData.schedule.endDate;

        // Step 3: Retrieve enrollments for the student in the current semester
        const enrollments = await Enrollment.find({
            studentId,
            enrollmentDate: {
                $gte: startDate, 
                $lte: endDate    
            }
        })
            .populate('classId')
            .populate('courseId')
            .exec();

        if (!enrollments || enrollments.length === 0) {
            return res.status(404).json({ message: "No enrollments found for the student in the current semester" });
        }

        // Step 4: Respond with the enrollments
        res.status(200).json({ enrollments });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const getEnrollments = async (req, res) => {
    try {
        const {
            studentId,
            classId,
            courseId,
            activitiesGrade,
            midtermGrade,
            labGrade,
            finalGrade,
            totalGrade,
            enroller,
            enrollerId,
            lock,
            isCapstone,
            isIncomplete,
            isWithdrawn,
            startDate,
            endDate,
            page = 1,  
            limit = 15  
        } = req.query;

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const filter = {};

        if (studentId) filter.studentId = studentId;
        if (classId) filter.classId = classId;
        if (courseId) filter.courseId = courseId;

        if (activitiesGrade) filter['grades.activities'] = Number(activitiesGrade);
        if (midtermGrade) filter['grades.midterm'] = Number(midtermGrade);
        if (labGrade) filter['grades.lab'] = Number(labGrade);
        if (finalGrade) filter['grades.final'] = Number(finalGrade);
        if (totalGrade) filter['grades.total'] = Number(totalGrade);

        if (enroller) filter.enroller = enroller;
        if (enrollerId) filter.enrollerId = enrollerId;

        if (lock !== undefined) filter.lock = lock === 'true';
        if (isCapstone !== undefined) filter.isCapstone = isCapstone === 'true';
        if (isIncomplete !== undefined) filter.isIncomplete = isIncomplete === 'true';
        if (isWithdrawn !== undefined) filter.isWithdrawn = isWithdrawn === 'true';

        if (startDate || endDate) {
            filter.enrollmentDate = {};
            if (startDate) filter.enrollmentDate.$gte = new Date(startDate);
            if (endDate) filter.enrollmentDate.$lte = new Date(endDate);
        }

        const totalEnrollments = await Enrollment.countDocuments(filter);

        const enrollments = await Enrollment.find(filter)
            .skip(skip)
            .limit(limitNumber);

        const totalPages = Math.ceil(totalEnrollments / limitNumber);

        res.status(200).json({
            pagination: {
                totalEnrollments,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            },
            enrollments
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = {
    deleteEnrollment,
    updateGrades,
    lockEnrollment,
    unlockEnrollment,
    getEnrollments,
    updateEnrollmentStatus,
    enrollInClass,
    getStudentEnrollments
};