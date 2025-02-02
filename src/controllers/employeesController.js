// This controller is outside the scope of this system.
// However, I have created a small controller as a brief example.
// This functionality falls under the responsibility of Human Resources.
const Employee = require("../models/employee-model");
const bcrypt = require("bcryptjs");
const fs = require('fs').promises;
const path = require('path');
const Counter = require('../models/counter-model');
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const getEmployees = async (req, res, next) => {
    try {
        const {
            employeeId,
            firstName,
            secondName,
            thirdName,
            lastName,
            dateOfBirthStart,
            dateOfBirthEnd,
            socialStatus,
            gender,
            nationality,
            deleted,
            idDocumentType,
            idDocumentNumber,
            address,
            phone,
            email,
            hireDateStart,
            hireDateEnd,
            employmentType,
            positionTitle,
            departmentId,
            createdAtStart,
            createdAtEnd,
            updatedAtStart,
            updatedAtEnd,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (employeeId) filter._id = employeeId;

        if (firstName) filter.firstName = { $regex: firstName, $options: "i" };
        if (secondName) filter.secondName = { $regex: secondName, $options: "i" };
        if (thirdName) filter.thirdName = { $regex: thirdName, $options: "i" };
        if (lastName) filter.lastName = { $regex: lastName, $options: "i" };

        // Filter by date of birth range (if provided)
        if (dateOfBirthStart || dateOfBirthEnd) {
            filter.dateOfBirth = {};
            if (dateOfBirthStart) filter.dateOfBirth.$gte = new Date(dateOfBirthStart); // Greater than or equal to startDate
            if (dateOfBirthEnd) filter.dateOfBirth.$lte = new Date(dateOfBirthEnd); // Less than or equal to endDate
        }

        if (socialStatus) filter.socialStatus = socialStatus;

        if (gender) filter.gender = gender;

        if (nationality) filter.nationality = nationality;

        if (deleted) filter.deleted = deleted === 'true';

        if (idDocumentType) filter['idDocument_details.idDocumentType'] = idDocumentType;
        if (idDocumentNumber) filter['idDocument_details.idDocumentNumber'] = idDocumentNumber;

        if (address) filter['contact_details.address'] = { $regex: address, $options: "i" }; 
        if (phone) filter['contact_details.phone'] = phone;
        if (email) filter['contact_details.email'] = email;

        if (hireDateStart || hireDateEnd) {
            filter.hireDate = {};
            if (hireDateStart) filter.hireDate.$gte = new Date(hireDateStart); 
            if (hireDateEnd) filter.hireDate.$lte = new Date(hireDateEnd); 
        }

        if (employmentType) filter.employmentType = employmentType;

        if (positionTitle) filter['positionsDetails.title'] = positionTitle;

        if (departmentId) filter['positionsDetails.departmentId'] = departmentId;

        if (createdAtStart || createdAtEnd) {
            filter.createdAt = {};
            if (createdAtStart) filter.createdAt.$gte = new Date(createdAtStart); 
            if (createdAtEnd) filter.createdAt.$lte = new Date(createdAtEnd); 
        }


        if (updatedAtStart || updatedAtEnd) {
            filter.updatedAt = {};
            if (updatedAtStart) filter.updatedAt.$gte = new Date(updatedAtStart); 
            if (updatedAtEnd) filter.updatedAt.$lte = new Date(updatedAtEnd); 
        }

        // Pagination
        const skip = (page - 1) * limit;

        const employees = await Employee.find(filter)
            .skip(skip)
            .limit(Number(limit));

        const totalEmployees = await Employee.countDocuments(filter);

        const totalPages = Math.ceil(totalEmployees / limit);

        res.status(200).json({
            pagination: {
                totalEmployees,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            },
            employees
        });
    } catch (error) {
        next(error); 
    }
};


const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            nationality,
            employmentType,
            title,
            departmentId,
            startDate, 
            address,   
            phone,
            email,
            idDocumentType,   
            idDocumentNumber,
            managerId
        } = req.body;

        
        const contact_details = {
            address,
            phone,
            email
        };

        const positionsDetails={
            title,
            departmentId,
            startDate,
            endDate:null
        }

        // Check if a file was uploaded for the ID document
        if (!req.file) {
            return res.status(400).json({ message: "ID document file is required" });
        }

        const idDocument_details = {
            idDocumentType,
            idDocumentNumber,
            idDocumentPath: req.file.filename
        };

        // Generate employee ID
        const year = new Date().getFullYear();
        const counterId = `employee-${year}`;

        // Increment the counter for the current year
        const counter = await Counter.findByIdAndUpdate(
            { _id: counterId },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true } // Create the counter if it doesn't exist
        );

        // Format the employee ID
        const employeeId = `E${year}${String(counter.sequence).padStart(4, '0')}`; // EYYYY0001

        // Check if the employee ID already exists
        const existingEmployee = await Employee.findOne({ _id: employeeId });
        if (existingEmployee) {
            return res.status(400).json({ message: "Employee with this ID already exists" });
        }

        // Generate a random 5-digit password
        const randomPassword = Math.floor(10000 + Math.random() * 90000);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword.toString(), salt);

        const employee = new Employee({
            _id: employeeId,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            nationality,
            hireDate: new Date(),
            employmentType,
            positionsDetails,
            password: hashedPassword,
            contact_details,
            managerId,
            idDocument_details
        });

        await employee.save();

        await makeAuditLog(AUDITING.CREATE_EMPLOYEE.action, 201, req.user.id, req.user.role, null, { employeeId });

        res.status(201).json({
            message: "Employee created successfully",
            employee,
            plainPassword: randomPassword,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findOne({ _id: id, deleted: false }).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const updateAllEmployeeInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            secondName,
            thirdName,
            lastName,
            dateOfBirth,
            socialStatus,
            gender,
            nationality,
            employmentType,
            managerId,
            address,
            phone,
            email
        } = req.body;

        const updateData = {};

        if (firstName) updateData.$set = { ...updateData.$set, firstName };
        if (secondName) updateData.$set = { ...updateData.$set, secondName };
        if (thirdName) updateData.$set = { ...updateData.$set, thirdName };
        if (lastName) updateData.$set = { ...updateData.$set, lastName };
        if (dateOfBirth) updateData.$set = { ...updateData.$set, dateOfBirth };
        if (socialStatus) updateData.$set = { ...updateData.$set, socialStatus };
        if (gender) updateData.$set = { ...updateData.$set, gender };
        if (nationality) updateData.$set = { ...updateData.$set, nationality };
        if (employmentType) updateData.$set = { ...updateData.$set, employmentType };
        if (managerId) updateData.$set = { ...updateData.$set, managerId };

        if (address) updateData.$set = { ...updateData.$set, "contact_details.address": address };
        if (phone) updateData.$set = { ...updateData.$set, "contact_details.phone": phone };
        if (email) updateData.$set = { ...updateData.$set, "contact_details.email": email };

        const employee = await Employee.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        await makeAuditLog(AUDITING.UPDATE_EMPLOYEE.action, 200, req.user.id, req.user.role, null, updateData);

        res.status(200).json({ message: "Employee updated successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const updateBasicEmployeeInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { address, phone, email } = req.body;

        if (!address && !phone && !email) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (phone && !/^\+?\d{7,15}$/.test(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }

        const updateData = {};

        if (address) updateData.$set = { ...updateData.$set, "contact_details.address": address };
        if (phone) updateData.$set = { ...updateData.$set, "contact_details.phone": phone };
        if (email) updateData.$set = { ...updateData.$set, "contact_details.email": email };

        const employee = await Employee.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ message: "Employee updated successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findOneAndUpdate(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        await makeAuditLog(AUDITING.DELETE_EMPLOYEE.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Employee deleted successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const activateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findOneAndUpdate(
            { _id: id, deleted: true }, 
            { deleted: false }, 
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found or already active" });
        }

        await makeAuditLog(AUDITING.ACTIVATE_EMPLOYEE.action, 200, req.user.id, req.user.role, null, { id });

        res.status(200).json({ message: "Employee activated successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const replaceIdDocument = async (req, res) => {
    try {
        const { employeeId } = req.params;  
        const { idDocumentType, idDocumentNumber } = req.body;  

        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        employee.idDocument_details = {
            idDocumentPath: req.file.path,  
            idDocumentType: idDocumentType,
            idDocumentNumber: idDocumentNumber,
        };

        await employee.save();  

        await makeAuditLog(AUDITING.REPLACE_ID_DOCUMENT.action, 200, req.user.id, req.user.role, null, employee.idDocument_details);

        res.status(200).json({ message: "ID Document updated successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


const addQualifications = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { type } = req.body;

        // Check if files were uploaded
        if (!req.files || !req.files['transcript'] || !req.files['certificate']) {
            return res.status(400).json({ message: "Transcript and certificate files are required" });
        }

        const transcriptFilename = req.files['transcript'][0].filename;
        const certificateFilename = req.files['certificate'][0].filename;

        const newQualification = {
            type,
            transcriptPath: transcriptFilename,
            certificatePath: certificateFilename,
        };

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        employee.qualifications.push(newQualification);
        await employee.save();

        await makeAuditLog(AUDITING.ADD_QUALIFICATION.action, 200, req.user.id, req.user.role, null, { employeeId, newQualification });

        res.status(201).json({
            message: "Qualification added successfully",
            qualification: newQualification,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteQualification = async (req, res) => {
    try {
        const { employeeId, qualificationId } = req.params; 

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Find the qualification in the qualifications array
        const qualificationIndex = employee.qualifications.findIndex(q => q._id.toString() === qualificationId);
        if (qualificationIndex === -1) {
            return res.status(404).json({ message: "Qualification not found for this employee" });
        }

        const qualificationToDelete = employee.qualifications[qualificationIndex];

        // Delete associated files 
        if (qualificationToDelete.transcriptPath) {
            const transcriptPath = path.join(__dirname, '..', '..', 'uploads', qualificationToDelete.transcriptPath);
            if (await fileExists(transcriptPath)) {
                await fs.unlink(transcriptPath); 
            }
        }

        if (qualificationToDelete.certificatePath) {
            const certificatePath = path.join(__dirname, '..', '..', 'uploads', { employeeId, qualificationId });
            if (await fileExists(certificatePath)) {
                await fs.unlink(certificatePath); 
            }
        }

        // Remove the qualification from the qualifications array
        employee.qualifications.splice(qualificationIndex, 1);

        await employee.save();

        await makeAuditLog(AUDITING.ADD_QUALIFICATION.action, 200, req.user.id, req.user.role, null, { employeeId, qualificationId });

        res.status(200).json({ message: "Qualification and associated files deleted successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath); 
        return true;
    } catch (error) {
        return false; 
    }
};


const addPosition = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { title, departmentId, startDate } = req.body;

        const employee = await Employee.findOne({ _id: employeeId, deleted: false });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Check if the employee already has an active position
        const activePosition = employee.positionsDetails.find(pos => !pos.endDate); // Ended position has an 'endDate'

        if (activePosition) {
            activePosition.endDate = new Date();
        }

        employee.positionsDetails.push({
            title,
            departmentId,
            startDate,
        });

        await makeAuditLog(AUDITING.ADD_POSITION.action, 200, req.user.id, req.user.role, null, { employeeId, title });

        await employee.save();

        res.status(200).json({ message: "Position added successfully and previous position ended", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const endPosition = async (req, res) => {
    try {
        const { employeeId, positionId } = req.params; 

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Find the position in the positionsDetails array
        const positionIndex = employee.positionsDetails.findIndex(pos => {
            const isMatch = pos._id.toString() === positionId;
            return isMatch;
        });

        if (positionIndex === -1) {
            return res.status(404).json({ message: "Position not found for this employee" });
        }

        // Update the position endDate to current date
        const position = employee.positionsDetails[positionIndex];
        position.endDate = new Date();  

        await employee.save();

        await makeAuditLog(AUDITING.END_POSITION.action, 200, req.user.id, req.user.role, null, { employeeId, positionId });

        res.status(200).json({
            message: "Position ended successfully",
            employee,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const sendNotificationToEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params; 
        const { title, body } = req.body; 
        const senderEmployeeId = req.user.id; 

        if(employeeId===senderEmployeeId){
            return res.status(400).json({ message: "You cannot send notifcation to yourself" });
        }
        if (!title || !body) {
            return res.status(400).json({ message: "Title and body are required" });
        }

        const senderEmployee = await Employee.findById(senderEmployeeId);
        if (!senderEmployee) {
            return res.status(404).json({ message: "Sender employee not found" });
        }

        // Find the recipient employee
        const recipientEmployee = await Employee.findById(employeeId);
        if (!recipientEmployee) {
            return res.status(404).json({ message: "Recipient employee not found" });
        }

        recipientEmployee.notifications.push({
            title,
            body,
            sender: senderEmployeeId, // Set the sender as the employee's ID
        });

        await recipientEmployee.save();

        res.status(201).json({
            message: "Notification sent successfully",
            notification: recipientEmployee.notifications[recipientEmployee.notifications.length - 1], // Return the last added notification
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteNotificationById = async (req, res) => {
    try {
        const { employeeId, notificationId } = req.params;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Find the notification index
        const notificationIndex = employee.notifications.findIndex(
            (notification) => notification._id.toString() === notificationId
        );

        if (notificationIndex === -1) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Remove the notification from the array
        employee.notifications.splice(notificationIndex, 1);

        await employee.save();

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteAllNotifications = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        employee.notifications = [];

        await employee.save();

        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const getAllNotifications = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications: employee.notifications,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = {
    getEmployees,
    createEmployee,
    getEmployeeById,
    updateAllEmployeeInfo,
    deleteEmployee,
    updateBasicEmployeeInfo,
    activateEmployee,
    replaceIdDocument, 
    addQualifications,
    deleteQualification,
    endPosition,
    addPosition,
    sendNotificationToEmployee,
    deleteNotificationById,
    deleteAllNotifications,
    getAllNotifications
};