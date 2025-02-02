const SYSTEM_ERROR_LOGGING = {
    DB_CONNECTION_FAILIURE: { name: "DB_CONNECTION_FAILIURE", data: "DB_CONNECTION_FAILIURE", message: "fail to connect to database" },
    UNCAUGHT_EXCEPTION: { name:"UNCAUGHT_EXCEPTION"},
    UNHANDLED_REJECTION: { name: "UNHANDLED_REJECTION" },
    CANNOT_READ_ENV_VARIABLES: { name: "CANNOT_READ_ENV_VARIABLES", message: "fail to read environment variables" },
    DB_CONNCTION_SUCCESS: { name: "DB_CONNCTION_SUCCESS", message: "connecting to mongodb" },
    DB_CONNCTION_DISCONNECTED: { name: "DB_CONNCTION_DISCONNECTED", message: "Mongoose disconnected from DB" },
}

module.exports = { SYSTEM_ERROR_LOGGING };
