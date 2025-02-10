const mongoose = require("mongoose");
const { Schema } = mongoose;
const { EMPLOYEE_POSITIONS } = require("../utils/constants/rolesConstants");
const positions = Object.values(EMPLOYEE_POSITIONS);


const EmployeeSchema = new Schema(
    {
        _id: {
            type: String,
            required: [true, "Employee ID is required"],
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
        gender: {
            type: String,
            enum: ["male", "female"],
            required: [true, "Gender is required"],
        },
        nationality: {
            type: String,
            required: [true, "Nationality is required"],
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        qualifications: [
            {
                _id: {
                    type: Schema.Types.ObjectId,  
                    auto: true,                   
                },
                type: {
                    type: String,
                    required: [true, "Qualification type is required"],
                },
                transcriptPath: {
                    type: String,
                    required: [true, "Transcript path is required"],
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
                match: [/^\+?\d{7,15}$/, "Invalid phone number format"],
            },
            email: {
                type: String,
                required: [true, "Email is required"],
                match: [
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    "Invalid email format",
                ],
            },
        },
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
                    ref: "Employee",
                },
                sentAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        hireDate: {
            type: Date,
            required: [true, "Hire date is required"],
        },
        employmentType: {
            type: String,
            enum: ["full-time", "part-time", "hourly", "contract"],
            required: [true, "Employment type is required"],
        },
        positionsDetails: [
            {
                _id: {
                    type: Schema.Types.ObjectId,  
                    auto: true,                   
                },
                title: {
                    type: String,
                    required: [true, "Position title is required"],
                    enum: [...positions],  
                },
                departmentId: {
                    type: String,
                    required: [true, "Department ID is required"],
                },
                startDate: {
                    type: Date,
                    required: [true, "Position start date is required"],
                },
                endDate: {
                    type: Date,
                },
            },
        ],
        managerId: {
            type: String,
            ref: "Employee",
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
    },
    {
        timestamps: true, 
    }
);


EmployeeSchema.methods.getCurrentPositionTitle = function () {
    const now = new Date();

    const currentPosition = this.positionsDetails.find(
        (position) =>
            position.startDate <= now &&
            (!position.endDate || position.endDate >= now)
    );

    return currentPosition ? currentPosition.title : null;
};



// Indexes
EmployeeSchema.index({ firstName: "text", lastName: "text" }); 

const employeeModel =mongoose.model("Employee", EmployeeSchema);
module.exports = employeeModel;
