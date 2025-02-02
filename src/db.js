require('dotenv').config(); 
const mongoose = require('mongoose');
const { systemInfoLogger } =require("./services/logger")
const { SYSTEM_ERROR_LOGGING }=require('./utils/constants/systemLoggingConstants');
const errorHandler =require("./utils/errorHandler");
const SystemError=require('./utils/customErrors/systemError')

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    errorHandler.handleError(
        new SystemError(SYSTEM_ERROR_LOGGING.CANNOT_READ_ENV_VARIABLES.name, 
        SYSTEM_ERROR_LOGGING.CANNOT_READ_ENV_VARIABLES.message, 
        "cannot read mongodb URI from env file"));
    process.exit(1); 
}

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
    } catch (error) {
        process.exit(1);
    }
};

mongoose.connection.on('connected', () => {
    systemInfoLogger(
        SYSTEM_ERROR_LOGGING.DB_CONNCTION_SUCCESS.message, 
        SYSTEM_ERROR_LOGGING.DB_CONNCTION_SUCCESS.name, 
        SYSTEM_ERROR_LOGGING.DB_CONNCTION_SUCCESS.data);
});

mongoose.connection.on('error', (error) => {
    errorHandler.handleError(
        new SystemError(SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.name, 
            SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.message, 
            SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.data));
});

mongoose.connection.on('disconnected', () => {
    errorHandler.handleError(
        new SystemError(SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.name, 
            SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.message, 
            SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.data));
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    errorHandler.handleError(
        new SystemError(SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.name, 
            SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.message, 
            SYSTEM_ERROR_LOGGING.DB_CONNCTION_DISCONNECTED.data));
    process.exit(0);
});

process.on("uncaughtException", async (err) => {
    await mongoose.connection.close();
    errorHandler.handleError(
        new SystemError(
        SYSTEM_ERROR_LOGGING.UNCAUGHT_EXCEPTION.name, 
        SYSTEM_ERROR_LOGGING.UNCAUGHT_EXCEPTION.message, 
        SYSTEM_ERROR_LOGGING.UNCAUGHT_EXCEPTION.data));
    process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
    await mongoose.connection.close();
    errorHandler.handleError(
        new SystemError(
        SYSTEM_ERROR_LOGGING.UNHANDLED_REJECTION.name, 
        SYSTEM_ERROR_LOGGING.UNHANDLED_REJECTION.message, 
        reason));
    process.exit(1);
});


module.exports=connectDB;