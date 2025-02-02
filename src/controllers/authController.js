const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/student-model'); 
const Employee = require('../models/employee-model');
const { STUDENT_ROLES }=require("../utils/constants/rolesConstants");
const crypto = require('crypto');
const { sendEmail }=require('../utils/email');
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN;
const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

const parseTimeToMilliseconds = (timeString) => {
    const unit = timeString.slice(-1); // Extract the unit (e.g., "d" for days)
    const value = parseInt(timeString.slice(0, -1), 10); // Extract the numeric value (e.g., 10)

    switch (unit) {
        case "s": 
            return value * 1000;
        case "m": 
            return value * 60 * 1000;
        case "h": 
            return value * 60 * 60 * 1000;
        case "d": 
            return value * 24 * 60 * 60 * 1000;
        case "w": 
            return value * 7 * 24 * 60 * 60 * 1000;
        default:
            throw new Error("Invalid time unit");
    }
};

const addPrefixtoId = (rawId, prefix) => {
    if (!rawId || typeof rawId !== "string") {
        throw new Error("Raw ID must be a non-empty string.");
    }
    if (!["S", "E"].includes(prefix)) {
        throw new Error("Prefix must be 'S' or 'E'.");
    }
    return `${prefix}${rawId}`;
};

const login = (prefix) => {
    return async (req, res) => {
        const rawId=req.body.id;
        const password=req.body.password;
        
        if(!rawId || !password){
            return res.status(400).json({ message: "missing id or Password "})        
        }

        if (!["E", "S"].includes(prefix)) {
            return res.status(400).json({ message: 'Invalid prefix. Must be "E" or "S".' });
        }

        const id = addPrefixtoId(rawId, prefix);

        try {
            let user;
            let role;
            let userType;

            if (prefix === "E") {
                user = await Employee.findOne({ _id: id }).select("firstName secondName thirdName lastName positionsDetails password");
                role = user.getCurrentPositionTitle(); 
                userType="Employee"

                if (!role) {
                    return res.status(400).json({ message: 'dont have any role in the system' });
                } 

            } else if (prefix === "S") {
                user = await Student.findOne({ _id: id }).select("firstName secondName thirdName lastName GPA status level faculty.facultyName department.departmentName planId password");
                role = STUDENT_ROLES.STUDENT; 
                userType = "Student"
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                if (prefix === "E") {
                    await makeAuditLog(AUDITING.EMPLOYEE_LOGIN.action, 401, req.user.id, req.user.role, { message: 'Invalid credentials' },null);
                }
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = jwt.sign(
                { id: user._id, role, userType }, 
                JWT_ACCESS_SECRET,
                { expiresIn: JWT_ACCESS_EXPIRES_IN }
            );

            const refreshToken = jwt.sign(
                { id: user._id, role, userType }, 
                JWT_REFRESH_SECRET,
                { expiresIn: JWT_REFRESH_EXPIRES_IN }
            );

            // Exclude password and positionsDetails from the response
            const userData = user.toObject();
            delete userData.password; 
            delete userData._id;

            if (prefix === "E") {
                await makeAuditLog(AUDITING.EMPLOYEE_LOGIN.action, 200, req.user.id, req.user.role, null, null);
                delete userData.positionsDetails;
            }

            res.status(200).json({
                message: 'Login successful',
                accessToken,
                refreshToken,
                user: userData,
            });
        } catch (error) {
            await makeAuditLog(AUDITING.EMPLOYEE_LOGIN.action, 500, req.user.id, req.user.role, error.message, null);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};


const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        let isExists;

        if (decoded.id.startsWith('E')) {
            isExists = await Employee.exists({ _id: decoded.id });
        } else if (decoded.id.startsWith('S'))  {
            isExists = await Student.exists({ _id: decoded.id});
        }else {
            return res.status(400).json({ message: 'Invalid id' });
        }

        if (!isExists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const accessToken = jwt.sign(
            { id: decoded.id, role: decoded.role }, 
            JWT_ACCESS_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRES_IN }
        );

        res.status(200).json({
            message: 'Access token refreshed',
            accessToken,
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};


const forgotPassword = (prefix) => {
    return async (req, res) => {
        const { id } = req.body;
        console.log({ id })
        if (!["E", "S"].includes(prefix)) {
            return res.status(400).json({ message: 'Invalid prefix. Must be "E" or "S".' });
        }

        try {
            let user;

            if (prefix === "E") {
                user = await Employee.findOne({ _id: addPrefixtoId(id,"E") });
            } else if (prefix === "S") {
                user = await Student.findOne({ _id: addPrefixtoId(id, "S") });
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const resetToken = crypto.randomBytes(20).toString('hex');
            user.resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            user.resetPasswordExpires = Date.now() + parseTimeToMilliseconds(RESET_TOKEN_EXPIRES_IN);

            await user.save();

            const resetUrl = `http://localhost:${PORT}/${prefix === 'E' ? 'employees' :'students'}/reset-password/${resetToken}`;  
            const message = `You are receiving this email because you (or someone else) has requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

            if (NODE_ENV==="production"){
                    await sendEmail(user.contact_details.email, 'Password Reset Request', message); 
                    return res.status(200).json({ message: 'Password reset email sent' });
            } else{
                return res.status(200).json({ message: 'Password reset' ,resetUrl});
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};


const resetPassword = (prefix) => {
    return async (req, res) => {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        if (!["E", "S"].includes(prefix)) {
            return res.status(400).json({ message: 'Invalid prefix. Must be "E" or "S".' });
        }

        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            let user;

            if (prefix === "E") {
                await makeAuditLog(AUDITING.EMPLOYEE_RESET_PASSWORD.action, 200, req.user.id, req.user.role, null, null);
                user = await Employee.findOne({
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: { $gt: Date.now() }, 
                });
            } else if (prefix === "S") {
                user = await Student.findOne({
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: { $gt: Date.now() }, 
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            if (prefix === "E") {
                await makeAuditLog(AUDITING.EMPLOYEE_RESET_PASSWORD.action, 500, req.user.id, req.user.role, error.message, null);
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; 

    const prefix = userId.charAt(0);

    if (!["E", "S"].includes(prefix)) {
        return res.status(400).json({ message: 'Invalid user ID prefix. Must start with "E" or "S".' });
    }

    try {
        let user;

        if (prefix === "E") {
            user = await Employee.findOne({ _id: userId }).select('password');
        } else if (prefix === "S") {
            user = await Student.findOne({ _id: userId }).select('password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        if (prefix === "E") {
            await makeAuditLog(AUDITING.EMPLOYEE_CHANGE_PASSWORD.action, 200, req.user.id, req.user.role, null, null);
        }

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        if (prefix === "E") {
            await makeAuditLog(AUDITING.EMPLOYEE_CHANGE_PASSWORD.action, 500, req.user.id, req.user.role, error.message, null);
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = { login, refreshToken, forgotPassword, resetPassword, changePassword }