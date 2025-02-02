const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Collection name + year (e.g., "student-2023")
    sequence: { type: Number, default: 1 }, // Current sequence value
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;