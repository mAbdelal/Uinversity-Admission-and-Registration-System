
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ClassSchema = new Schema(
    {
        courseDetails: {
            courseId: {
                type: String,
                required: [true, "Course ID is required"],
                ref: "Course"
            },
            name: {
                type: String,
                required: [true, "Course name is required"],
            },
            credits: {
                type: Number,
                required: [true, "Credits are required"],
                enum: [1, 2, 3],
            },
        },

        semesterId: {
            type: String,
            required: [true, "Semester ID is required"],
            ref: "Semester"
        },

        name: {
            type: String,
            required: [true, "Name is required"],
            default: "101"
        },

        roomId: {
            type: String,
            required: [true, "Room ID is required"],
        },

        lock: { //To prevent students from enrolling or unrolling themselves from a class 
            type: Boolean,
            default: false, 
        },

        // (Schedule)
        appointments: [
            {
                _id: {
                    type: Schema.Types.ObjectId,
                    auto: true,
                },
                day: {
                    type: String,
                    required: [true, "Day is required"],
                    enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                },
                startTime: {
                    type: String,
                    required: [true, "Start time is required"],
                    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)"],
                },
                endTime: {
                    type: String,
                    required: [true, "End time is required"],
                    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)"],
                },
            },
        ],

        instructorDetails: {
            instructorId: {
                type: String,
                ref: "Employee",
                required: [true, "Instructor ID is required"],
            },
            instructorName: {
                type: String,
                required: [true, "Instructor name is required"],
            },
        },

        status: {
            type: String,
            enum: ["temporary", "final"],
            default: "temporary",
            required: [true, "Enrollment status is required"],
        },
    },
    { timestamps: true } 
);


ClassSchema.index({ "courseDetails.courseId": 1 }); // Index for faster queries by course ID
ClassSchema.index({ semesterId: 1 }); // Index for faster queries by semester ID



const classModel = mongoose.model("Class", ClassSchema);
module.exports = classModel