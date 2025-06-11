const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for faster queries
transactionSchema.index({ userId: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 