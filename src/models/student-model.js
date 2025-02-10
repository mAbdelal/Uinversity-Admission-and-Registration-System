const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema(
    {
        _id: {
            type: String,
            required: [true, "Student ID is required"],
            unique: true,
        },
        firstName: {
            type: String,
            required: [true, "First name is required"],
        },
        secondName: {
            type: String,
        },
        thirdName: {
            type: String,
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
        },
        dateOfBirth: {
            type: Date,
            required: [true, "Date of birth is required"],
        },
        socialStatus: {
            type: String,
            enum: ["single", "married", "divorced", "widowed"],
            default: "single",
        },
        GPA: {
            type: Number,
            min: [0, "GPA cannot be less than 0"],
            max: [100, "GPA cannot be greater than 100"],
            default: 0,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: [true, "Gender is required"],
        },
        status: {
            type: String,
            enum: ["active", "graduated", "suspended", "withdrawn"],
            required: [true, "Status is required"],
        },
        level: {
            type: Number,
            enum: [1, 2, 3, 4, 5, 6],
            required: [true, "Level is required"],
        },
        nationality: {
            type: String,
            required: [true, "Nationality is required"],
        },
        studyingDegree: {
            type: String,
            enum: ["bachelor", "master", "phd", "diploma", "associate"],
            required: [true, "Current studying degree type is required"],
        },
        faculty: {
            facultyId: {
                type: String,
                required: [true, "Faculty ID is required"],
            },
            facultyName: {
                type: String,
                required: [true, "Faculty name is required"],
            },
        },
        department: {
            departmentId: {
                type: String,
                required: [true, "Department ID is required"],
            },
            departmentName: {
                type: String,
                required: [true, "Department name is required"],
            },
        },
        planId: {
            type: String,
            required: [true, "Plan ID is required"],
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        previousDegrees: [
            {
                _id: {
                    type: Schema.Types.ObjectId, 
                    auto: true, 
                },
                type: {
                    type: String,
                    required: [true, "Degree type is required"],
                },
                transcriptPath: {
                    type: String,
                    required: [true, "Transcript path is required"],
                },
                GPA: {
                    type: Number,
                    min: [0, "GPA cannot be less than 0"],
                    max: [100, "GPA cannot be greater than 100"],
                    required: [true, "GPA is required"],
                },
                certificatePath: {
                    type: String,
                    required: [true, "Certificate path is required"],
                },
            },
        ],
        idDocument_details: {
            idDocumentPath: {
                type: String,
                required: [true, "ID document path is required"],
            },
            idDocumentType: {
                type: String,
                enum: ["passport", "national_id", "other"],
                required: [true, "ID document type is required"],
            },
            idDocumentNumber: {
                type: String,
                required: [true, "ID document number is required"],
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        contact_details: {
            address: {
                type: String,
                required: [true, "Address is required"],
            },
            phone: {
                type: String,
                required: [true, "Phone number is required"],
            },
            email: {
                type: String,
                match: [
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    "Invalid email format",
                ],
            },
        },
        additionalPermissions: [
            {
                permissionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Permission",
                    required: [true, "Permission ID is required"],
                },
                permissionEndDate: {
                    type: Date,
                },
                permissionStartDate: {
                    type: Date,
                    required: [true, "Permission start time is required"],
                },
                grantedBy: {
                    type: String,
                    ref: "Employee",
                    required: [true, "GrantedBy is required"],
                },
            },
        ],
        notifications: [
            {
                _id: {
                    type: Schema.Types.ObjectId, 
                    auto: true, 
                },
                title: {
                    type: String,
                    required: [true, "Notification title is required"],
                },
                body: {
                    type: String,
                    required: [true, "Notification body is required"],
                },
                sender: {
                    type: String,
                    required: [true, "Sender is required"],
                },
                sentAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true, 
    }
);

StudentSchema.index({ status: 1 }); 
StudentSchema.index({ "department.departmentId": 1 });
StudentSchema.index({ "faculty.facultyId": 1}); 
StudentSchema.index({ firstName: "text", lastName: "text" }); 


const studentModel = mongoose.model("Student", StudentSchema);
module.exports = studentModel;

