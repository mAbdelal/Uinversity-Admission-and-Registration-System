const Semester = require("../models/semester-model");
const makeAuditLog = require("../services/auditing");
const AUDITING = require("../utils/constants/auditConstants");

const createSemester = async (req, res) => {
    try {
        const {
            _id,
            name,
            startDate,
            endDate,
            enrollmentStartDate,
            enrollmentEndDate,
            finalExamsStartDate,
            finalExamsEndDate,
            midtermExamsStartDate,
            midtermExamsEndDate,
        } = req.body;

        const existingSemester = await Semester.findOne({ _id });
        if (existingSemester) {
            return res.status(400).json({ message: "Semester with this ID already exists" });
        }

        const semester = new Semester({
            _id,
            name,
            schedule: {
                startDate,
                endDate,
                enrollmentStartDate,
                enrollmentEndDate,
                finalExamsStartDate,
                finalExamsEndDate,
                midtermExamsStartDate,
                midtermExamsEndDate,
            },
        });

        await semester.save();

        await makeAuditLog(AUDITING.CREATE_SEMESTER.action, 201, req.user.id, req.user.role, null, { semesterId: _id });

        res.status(201).json({ message: "Semester created successfully", semester });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

const getSemesterById = async (req, res) => {
    try {
        const { id } = req.params;
        const semester = await Semester.findOne({ _id: id });

        if (!semester) {
            return res.status(404).json({ message: "Semester not found" });
        }

        res.status(200).json({ semester });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            startDate,
            endDate,
            enrollmentStartDate,
            enrollmentEndDate,
            finalExamsStartDate,
            finalExamsEndDate,
            midtermExamsStartDate,
            midtermExamsEndDate,
        } = req.body;

        const existingSemester = await Semester.findById(id);
        if (!existingSemester) {
            return res.status(404).json({ message: "Semester not found" });
        }

        const updateData = {
            schedule: {
                startDate: startDate ?? existingSemester.schedule.startDate,
                endDate: endDate ?? existingSemester.schedule.endDate,
                enrollmentStartDate: enrollmentStartDate ?? existingSemester.schedule.enrollmentStartDate,
                enrollmentEndDate: enrollmentEndDate ?? existingSemester.schedule.enrollmentEndDate,
                finalExamsStartDate: finalExamsStartDate ?? existingSemester.schedule.finalExamsStartDate,
                finalExamsEndDate: finalExamsEndDate ?? existingSemester.schedule.finalExamsEndDate,
                midtermExamsStartDate: midtermExamsStartDate ?? existingSemester.schedule.midtermExamsStartDate,
                midtermExamsEndDate: midtermExamsEndDate ?? existingSemester.schedule.midtermExamsEndDate,
            }
        };

        const semester = await Semester.findByIdAndUpdate(id, updateData, { new: true });

        await makeAuditLog(AUDITING.UPDATE_SEMESTER.action, 200, req.user.id, req.user.role, null, { semesterId: id });

        res.status(200).json({ message: "Semester updated successfully", semester });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;

        const semester = await Semester.findOneAndDelete({ _id: id });

        if (!semester) {
            return res.status(404).json({ message: "Semester not found" });
        }

        await makeAuditLog(AUDITING.DELETE_SEMESTER.action, 200, req.user.id, req.user.role, null, { semesterId: id });

        res.status(200).json({ message: "Semester deleted successfully", semester });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const getSemesters = async (req, res) => {
    try {
        const {
            semesterId,
            name,
            startDate,
            endDate,
            enrollmentStartDate,
            enrollmentEndDate,
            finalExamsStartDate,
            finalExamsEndDate,
            midtermExamsStartDate,
            midtermExamsEndDate,
            createdAtStart,
            createdAtEnd,
            updatedAtStart,
            updatedAtEnd,
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Math.max(1, Number(page));
        const limitNumber = Math.max(1, Number(limit));

        const filter = {};

        if (semesterId) filter._id = semesterId;

        if (name) filter.name = { $regex: name, $options: "i" };

        if (startDate || endDate || enrollmentStartDate || enrollmentEndDate || finalExamsStartDate || finalExamsEndDate || midtermExamsStartDate || midtermExamsEndDate) {
            filter.schedule = {};
            if (startDate) filter.schedule.startDate = { $gte: new Date(startDate) };
            if (endDate) filter.schedule.endDate = { $lte: new Date(endDate) };
            if (enrollmentStartDate) filter.schedule.enrollmentStartDate = { $gte: new Date(enrollmentStartDate) };
            if (enrollmentEndDate) filter.schedule.enrollmentEndDate = { $lte: new Date(enrollmentEndDate) };
            if (finalExamsStartDate) filter.schedule.finalExamsStartDate = { $gte: new Date(finalExamsStartDate) };
            if (finalExamsEndDate) filter.schedule.finalExamsEndDate = { $lte: new Date(finalExamsEndDate) };
            if (midtermExamsStartDate) filter.schedule.midtermExamsStartDate = { $gte: new Date(midtermExamsStartDate) };
            if (midtermExamsEndDate) filter.schedule.midtermExamsEndDate = { $lte: new Date(midtermExamsEndDate) };
        }

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

        const totalSemesters = await Semester.countDocuments(filter);

        const totalPages = Math.ceil(totalSemesters / limitNumber);

        const semesters = await Semester.find(filter)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        res.status(200).json({
            pagination: {
                totalSemesters,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            },
            semesters
        });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

module.exports = {
    createSemester,
    getSemesterById,
    updateSemester,
    deleteSemester,
    getSemesters,
};