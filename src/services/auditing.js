const Audit = require('../models/audit-model');
const SystemError = require('../utils/customErrors/systemError');
const errorHandler =require('../utils/errorHandler')
const {SYSTEM_ERROR_LOGGING}=require('../utils/constants/systemLoggingConstants')

const makeAuditLog = async (action, status, userId, userType, error, data)=>{
    try {
        const audit = new Audit({ action, status, userId, userType, error, data });
        await audit.save();
    } catch (e) {
        errorHandler.handleError(new SystemError(SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.name, SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.message, SYSTEM_ERROR_LOGGING.DB_CONNECTION_FAILIURE.data));  
    }
}

module.exports = makeAuditLog;