const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./db");
const errorHandler=require('./utils/errorHandler');

dotenv.config();

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(limiter);

const authRoutes=require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const requestRoutes = require("./routes/requestRoutes");
const classRoutes = require("./routes/classRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const semesterRoutes = require("./routes/semesterRoutes");

connectDB().then(() => {
        app.use("/api/v1/auth", authRoutes);
        app.use("/api/v1/courses", courseRoutes);
        app.use("/api/v1/faculties", facultyRoutes);
        app.use("/api/v1/students", studentRoutes);
        app.use("/api/v1/employees", employeeRoutes);
        app.use("/api/v1/permissions", permissionRoutes);
        app.use("/api/v1/audits", auditRoutes);
        app.use("/api/v1/requests", requestRoutes);
        app.use("/api/v1/classes", classRoutes);
        app.use("/api/v1/enrollments", enrollmentRoutes);
        app.use("/api/v1/semesters", semesterRoutes);

        app.use((error,req,res,next)=>{
            errorHandler.handleError(error);
            res.status(500).json({message:"Internal server error"});
        });

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on http://localhost:${process.env.PORT} in ${process.env.NODE_ENV} mode`
            );
        });
    });
