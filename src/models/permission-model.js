const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const permissions = Object.values(require('../utils/constants/permissionConstants'));
const { EMPLOYEE_POSITIONS, STUDENT_ROLES } = require('../utils/constants/rolesConstants');
const employeePositions = Object.values(EMPLOYEE_POSITIONS);
const studentPosisions = Object.values(STUDENT_ROLES);

const permissionSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "name field is required"],
            enum: [...permissions],
        },
        owner: {
            type: String,
            required: [true, "owner field is required"],
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        granter: [
            {
                _id: false,
                type: String, 
            },
        ],
        
        possibleGranterRoles: [
            {
                _id: false,
                type: String,
                enum: [...employeePositions], 
            },
        ],
        possibleForRoles: [
            {
                _id: false,
                type: String,
                enum: [...employeePositions, ...studentPosisions],
            },
        ],

        usersWithPermission: [
            {
                _id: false,
                type: String, 
            },
        ],
    },
    {
        timestamps: true,
    }
);

requestSchema.index({ owner: 1 }); 

const permissionModel = mongoose.model("Permission", permissionSchema);
module.exports = permissionModel;

