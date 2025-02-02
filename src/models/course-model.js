const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
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
    credits: {
        type: Number,         
        enum: [1, 2, 3],
        required: true,
    },
    description: {
        type: String,         
        required: true,
        minlength: 10,        
    },
    audience: {
        type: String, 
        enum: ["Department-Specific", "Faculty-Wide", "University-Wide"],
        required: true,
    },
    departmentId: {
        type: String,         // Department ID, to reference the department
        required: function () { return this.courseType === "Department-Specific"; },
    },
    facultyId: {
        type: String,         // Faculty ID, to reference the faculty (for Faculty-Wide courses)
        required: function () { return this.courseType === "Faculty-Wide"; },
    },
    prerequisites: [
        {
            type: String,       
            ref: 'Course',      
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,    
    },
    updatedAt: {
        type: Date,
        default: Date.now,    
    },
    deleted: {
        type: Boolean,        
        default: false,
    },
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;