// complete errors
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnrollmentSchema = new Schema(
    {
        studentId: {
            type: String,
            required: [true, "Student ID is required"],
            ref: "Student"
        },

        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: [true, "Class ID is required"],
        },

        courseId: {
            type: String,
            required: [true, "Course ID is required"],
            ref: "Course"
        },

        grades: {
            activities: {
                type: Number,
                min: [0, "Activities grade cannot be less than 0"],
                max: [20, "Activities grade cannot be greater than 20"],
                default: 0,
            },
            midterm: {
                type: Number,
                min: [0, "Midterm grade cannot be less than 0"],
                max: [20, "Midterm grade cannot be greater than 20"],
                default: 0,
            },
            lab: {
                type: Number,
                min: [0, "Lab grade cannot be less than 0"],
                max: [30, "Lab grade cannot be greater than 30"],
                default: 0,
            },
            final: {
                type: Number,
                min: [0, "Final grade cannot be less than 0"],
                max: [60, "Final grade cannot be greater than 60"],
                default: 0,
            },
            total: {
                type: Number,
                min: [0, "Total grade cannot be less than 0"],
                max: [100, "Total grade cannot be greater than 100"],
                required: true,
            },
        },
        enrollmentDate: {
            type: Date,
            default: Date.now,
        },
        enroller: {
            type: String,
            enum: ["student", "employee"],
            required: [true, "Enroller type is required"],
        },

        enrollerId: {
            type: String,
            required: [true, "Enroller ID is required"],
        },
        lock: { //To prevent student from unrolling himself from a class 
            type: Boolean,
            default: false,
        },
        isCapstone: {
            type: Boolean,
            required: false,
        },

        isIncomplete: {
            type: Boolean,
            required: false,
        },
        isWithdrawn:{
            type: Boolean,
            required: false,
        }
    },
);



// Indexes
// EnrollmentSchema.index({ studentId: 1 }); // Index for faster queries by studentId
// EnrollmentSchema.index({ classId: 1 }); // Index for faster queries by classId
// EnrollmentSchema.index({ "grades.total": -1 }); // Index for sorting by total grade (descending)
// EnrollmentSchema.index({ enrollmentDate: -1 }); // Index for sorting by enrollment date (descending)

// Export the model
const enrollmentModel = mongoose.model("Enrollment", EnrollmentSchema);
module.exports = enrollmentModel;