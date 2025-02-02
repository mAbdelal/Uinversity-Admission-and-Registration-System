const mongoose = require("mongoose");
const { Schema } = mongoose;

const facultySchema = new Schema(
    {
        _id: {
            type: String,
            required: [true, "Faculty ID is required"],
            unique: true,
        },
        facultyName: {
            type: String,
            required: [true, "Faculty name is required"],
        },
        deleted: {
            type: Boolean,
            default: false
        }
        ,
        departments: [
            {
                _id:false,
                departmentId: {
                    type: String,
                    required: [true, "Department ID is required"],
                },
                departmentName: {
                    type: String,
                    required: [true, "Department name is required"],
                },
                headId: {
                    type: String,
                    required: [true, "Department head ID is required"],
                    ref:"Employee"
                },
                planId: {
                    type: String,
                    required: [true, "Plan ID is required"],
                },
                previousPlans: [
                    {
                        type: String,
                    },
                ],
                deleted: {
                    type: Boolean,
                    default: false
                }
            },
        ],
        headId: {
            type: String,
            required: [true, "Faculty head ID is required"],
        },
        establishedDate: {
            type: Date,
            default: Date.now,
        },
        address: {
            type: String,
        },
        contactDetails: {
            phone: {
                type: String,
                required: [true, "Contact phone number is required"],
                match: [/^\+?\d{7,15}$/, "Invalid phone number format"],
            },
            email: {
                type: String,
                required: [true, "Contact email is required"],
                match: [
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    "Invalid email format",
                ],
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// facultySchema.index({ "departments.departmentId": 1 }); // Index for faster queries by department ID
// facultySchema.index({ facultyName: "text" }); // Text index for searching by faculty name


module.exports = mongoose.model("Faculty", facultySchema);