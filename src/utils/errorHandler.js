const { systemErrorLogger } = require('../services/logger');

class ErrorHandler {

    async handleError(systemError){
        systemErrorLogger(systemError.message, systemError.name, systemError.data);
    }
}
const errorHandler = new ErrorHandler();
module.exports = errorHandler;
