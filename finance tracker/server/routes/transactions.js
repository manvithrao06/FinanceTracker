const express = require('express');
const router = express.Router();
const { auth, verifyTransactionOwnership, verifyStatsAccess } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// Apply auth middleware to all routes
router.use(auth);

// Get all transactions for the authenticated user
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction statistics
router.get('/stats', verifyStatsAccess, async (req, res) => {
  try {
    const { startDate } = req.query;
    const query = { user: req.user._id };
    
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    // Get all transactions for the period
    const transactions = await Transaction.find(query);

    // Calculate summary
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    // Get category distribution
    const categoryData = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      }, {});

    // Format category data for chart
    const formattedCategoryData = Object.entries(categoryData).map(([category, expense]) => ({
      category,
      expense,
    }));

    // Get monthly data
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.date.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expense += transaction.amount;
      }
      
      acc[month].balance = acc[month].income - acc[month].expense;
      return acc;
    }, {});

    // Format monthly data for chart
    const formattedMonthlyData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary,
      categoryData: formattedCategoryData,
      monthlyData: formattedMonthlyData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      user: req.user._id,
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single transaction
router.get('/:id', verifyTransactionOwnership, async (req, res) => {
  res.json(req.transaction);
});

// Update transaction
router.put('/:id', verifyTransactionOwnership, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', verifyTransactionOwnership, async (req, res) => {
  try {
    await req.transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 