const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AUDITING  = require("../utils/constants/auditConstants");
const auditActions = Object.keys(AUDITING);

const AuditSchema = new Schema(
    {
        action: {
            type: String,
            required: [true, "Action field is required"],
            enum: [...auditActions],
        },
        status: {
            type: Number,
            required: [true, "Status field is required"],
            min: [100, "Status must be a valid HTTP status code (>= 100)"],
            max: [599, "Status must be a valid HTTP status code (<= 599)"],
        },
        userId: {
            type: String, 
            required: [true, "UserId field is required"],
        },
        userType: {
            type: String,
            required: [true, "UserType field is required"],
        },
        error: {
            type: String,
            maxlength: [500, "Error message cannot exceed 500 characters"],
        },
        data: {
            type: String,
            maxlength: [2000, "Data field cannot exceed 2000 characters"], 
        },
        createdAt:{
            type: Date,
            default: new Date()
        }
    },
);

AuditSchema.index({ userId: 1 }); 


module.exports = mongoose.model("Audit", AuditSchema);
