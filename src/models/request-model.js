const mongoose = require('mongoose');
const { Schema } = mongoose;
const { EMPLOYEE_POSISTIONS, STUDENT_ROLES }  = require('../utils/constants/rolesConstants')
const employeePositions = Object.values(EMPLOYEE_POSISTIONS)
const studentPositions = Object.values(STUDENT_ROLES)

const requestSchema = new Schema(
    {
        title: {
            type: String,
            required: true, 
            trim: true, 
        },
        body: {
            type: String,
            required: true, 
        },
        response: {
            type: String,
            trim: true, 
        },
        responseDate: {
            type: Date,
            required: false, 
        },
        requestDate: {
            type: Date,
            default: Date.now, 
        },
        responderID: {
            type: String,
            ref: 'Employee',
            required: false, // Not required immediately, can be filled after the response
        },
        requesterID: {
            type: String,
            required: true, 
        },
        responderPossiblePosition: {
            type: String,
            enum: [...employeePositions],
            required: true,
        },
        requesterRole: {
            type: String,
            enum: [...employeePositions, ...studentPositions], 
            required: true,
        },
    }
);


requestSchema.index({ requesterID: 1 }); 
requestSchema.index({ responderID: 1 }); 
requestSchema.index({ requestDate: -1 }); 
requestSchema.index({ responseDate: -1 }); 
requestSchema.index({ requesterRole: 1 }); 
requestSchema.index({ responderPosition: 1 }); 

// Create the Request Model
const Request = mongoose.model('Request', requestSchema);
module.exports=Request;