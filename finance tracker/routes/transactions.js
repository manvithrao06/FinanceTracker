const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

// Get all transactions for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new transaction
router.post('/', auth, async (req, res) => {
    try {
        const { type, amount, category, note, date } = req.body;

        // Validate required fields
        if (!type || !amount || !category) {
            return res.status(400).json({ 
                message: 'Type, amount, and category are required' 
            });
        }

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ 
                message: 'Type must be either income or expense' 
            });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ 
                message: 'Amount must be greater than 0' 
            });
        }

        const transaction = new Transaction({
            userId: req.user._id,
            type,
            amount,
            category,
            note,
            date: date || new Date()
        });

        const savedTransaction = await transaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
    try {
        const { type, amount, category, note, date } = req.body;

        // Find transaction and verify ownership
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Update fields if provided
        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ 
                    message: 'Type must be either income or expense' 
                });
            }
            transaction.type = type;
        }
        if (amount !== undefined) {
            if (amount <= 0) {
                return res.status(400).json({ 
                    message: 'Amount must be greater than 0' 
                });
            }
            transaction.amount = amount;
        }
        if (category) transaction.category = category;
        if (note !== undefined) transaction.note = note;
        if (date) transaction.date = date;

        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { userId: req.user._id };

        // Add date filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Get all transactions for the period
        const transactions = await Transaction.find(query);

        // Calculate summary totals
        const summary = transactions.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.totalIncome += transaction.amount;
            } else {
                acc.totalExpense += transaction.amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        summary.netBalance = summary.totalIncome - summary.totalExpense;

        // Group by category
        const categoryStats = transactions.reduce((acc, transaction) => {
            const { category, type, amount } = transaction;
            if (!acc[category]) {
                acc[category] = { income: 0, expense: 0 };
            }
            if (type === 'income') {
                acc[category].income += amount;
            } else {
                acc[category].expense += amount;
            }
            return acc;
        }, {});

        // Group by month
        const monthlyStats = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthKey]) {
                acc[monthKey] = { income: 0, expense: 0 };
            }
            
            if (transaction.type === 'income') {
                acc[monthKey].income += transaction.amount;
            } else {
                acc[monthKey].expense += transaction.amount;
            }
            
            return acc;
        }, {});

        // Format monthly data for Chart.js
        const monthlyData = Object.entries(monthlyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                month,
                income: data.income,
                expense: data.expense,
                balance: data.income - data.expense
            }));

        // Format category data for Chart.js
        const categoryData = Object.entries(categoryStats).map(([category, data]) => ({
            category,
            income: data.income,
            expense: data.expense,
            total: data.income + data.expense
        }));

        res.json({
            summary,
            monthlyData,
            categoryData,
            // Additional data points that might be useful for charts
            topCategories: categoryData
                .sort((a, b) => b.total - a.total)
                .slice(0, 5),
            monthlyTrend: monthlyData.map(data => ({
                month: data.month,
                balance: data.balance
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 