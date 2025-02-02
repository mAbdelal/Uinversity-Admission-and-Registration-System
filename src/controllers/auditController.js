const Audit = require("../models/audit-model");
const makeAuditLog=require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const deleteOldAudits = async (req, res) => {
    const { date } = req.body;

    if (!date) {
        await makeAuditLog(AUDITING.DELETE_OLD_AUDITS.action, 400, req.user.id, req.user.role, { message: "Date is required" }, { date });
        return res.status(400).json({ message: "Date is required" });
    }

    try {
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            await makeAuditLog(AUDITING.DELETE_OLD_AUDITS.action, 400, req.user.id, req.user.role, { message: "Invalid date format" }, { date });
            return res.status(400).json({ message: "Invalid date format" });
        }

        const result = await Audit.deleteMany({ message: { $lt: targetDate } });

        await makeAuditLog(AUDITING.DELETE_OLD_AUDITS.action, 200, req.user.id, req.user.role, null, {date});

        return res.status(200).json({
            message: "Old audit logs deleted successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        await makeAuditLog(AUDITING.DELETE_OLD_AUDITS.action, 500, req.user.id, req.user.role, error.message, { date });
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getAuditLogById = async (req, res) => {
    const { id } = req.params;

    try {
        const auditLog = await Audit.findOne({ _id: id });

        if (!auditLog) {
            return res.status(404).json({ message: "Audit log not found" });
        }


        res.status(200).json({ auditLog });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getAuditLogs = async (req, res) => {
    const filter = {};
    try {
        const { action, status, userId, userType, error, startDate, endDate } = req.query;


        if (action) filter.action = action;
        if (status) filter.status = Number(status); 
        if (userId) filter.userId = userId;
        if (userType) filter.userType = userType;
        if (error) filter.error = { $regex: error, $options: "i" }; 

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate); 
            if (endDate) filter.createdAt.$lte = new Date(endDate); 
        }


        const auditLogs = await Audit.find(filter);

        res.status(200).json({ auditLogs });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = {
    getAuditLogById,
    getAuditLogs,
    deleteOldAudits
};