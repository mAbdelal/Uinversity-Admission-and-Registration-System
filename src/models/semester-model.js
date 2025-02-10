const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const NodeCache = require("node-cache");
const ApiError=require("../utils/customErrors/apiError")

// Create a cache with a TTL (time-to-live) of 1 week
const cache = new NodeCache({ stdTTL: 604800 });

const semesterSchema = new Schema(
    {
        _id: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        schedule: {
            startDate: {
                type: Date,
                required: true,
            },
            endDate: {
                type: Date,
                required: true,
            },
            enrollmentStartDate: {
                type: Date,
                required: true,
            },
            enrollmentEndDate: {
                type: Date,
                required: true,
            },
            finalExamsStartDate: {
                type: Date,
                required: true,
            },
            finalExamsEndDate: {
                type: Date,
                required: true,
            },
            midtermExamsStartDate: {
                type: Date,
                required: true,
            },
            midtermExamsEndDate: {
                type: Date,
                required: true,
            },
        },
    },
    {
        timestamps: true, 
    }
);
// Static function to get the current semester
semesterSchema.statics.getCurrentSemester = async function () {
    const cacheKey = "currentSemester";

    const cachedSemester = cache.get(cacheKey);
    if (cachedSemester) {
        return cachedSemester;
    }

    const now = new Date();
    const currentSemester = await this.findOne({
        "schedule.startDate": { $lte: now },
        "schedule.endDate": { $gte: now },
    });

    if (currentSemester) {
        cache.set(cacheKey, currentSemester._id);
    }

    return currentSemester._id;
};

semesterSchema.statics.getCurrentSemesterData = async function () {
    const cacheKey = "currentSemesterData";

    const cachedSemester = cache.get(cacheKey);
    if (cachedSemester) {
        return cachedSemester;
    }

    const now = new Date();
    const currentSemester = await this.findOne({
        "schedule.startDate": { $lte: now },
        "schedule.endDate": { $gte: now },
    });

    if (currentSemester) {
        cache.set(cacheKey, currentSemester._id);
    }

    return currentSemester;
};


// Middleware (Hooks)
semesterSchema.pre("save", function (next) {
    let errorData;
    let errorOccur = false;

    // Validate start and end dates
    if (this.schedule.startDate >= this.schedule.endDate) {
        errorOccur = true;
        errorData = "Start date must be before end date.";
    }
    if (this.schedule.enrollmentStartDate >= this.schedule.enrollmentEndDate) {
        errorOccur = true;
        errorData = "Enrollment start date must be before enrollment end date.";
    }
    if (this.schedule.midtermExamsStartDate >= this.schedule.midtermExamsEndDate) {
        errorOccur = true;
        errorData = "Midterm exams start date must be before midterm exams end date.";
    }
    if (this.schedule.finalExamsStartDate >= this.schedule.finalExamsEndDate) {
        errorOccur = true;
        errorData = "Final exams start date must be before final exams end date.";
    }

    if (errorOccur) {
        const error = new Error("Invalid date range");
        error.statusCode = 400; 
        error.details = errorData;
        return next(error); 
    }

    this.updatedAt = new Date();
    next(); 
});


semesterSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });




const semesterModel = mongoose.model('Semester', semesterSchema);
module.exports = semesterModel;

