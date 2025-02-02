
const winston = require('winston');
const { combine, timestamp, printf } = winston.format;

const customFormat = printf(({ level, message, timestamp, meta = {} }) => {
    const { name, statusCode, userId, userType, data } = meta;
    let log = `[${timestamp}]|${level.toUpperCase()}|${name}|${message}`;
    if (data) {
        log += `|${data}`;
    }
    if (statusCode) {
        log += `|${statusCode}`;
    }
    if (userId) {
        log += `|${userId}`;
    }
    if (userType) {
        log += `|${userType}`;
    }
    return log;
});

const winstonLogger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        customFormat
    ),
    transports: [
        new winston.transports.File({ filename: 'src/logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'src/logs/info.log', level: 'info' })
    ],
});

if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston.transports.Console({
        format: combine(timestamp(), customFormat),
    }));
}

const systemErrorLogger = (name, message, data ) => {
    const meta = { name,data };
    winstonLogger.error(message, { meta }); 
};

const systemInfoLogger = (name, message, data) => {
    const meta = { name, data };
    winstonLogger.info(message, { meta });
};


module.exports = { systemErrorLogger, systemInfoLogger };