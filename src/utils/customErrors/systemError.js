class SystemError extends Error {
    constructor(name, message, data) {
        super(message)
        this.name = name;
        this.data = data;
    }
}

module.exports = SystemError;

