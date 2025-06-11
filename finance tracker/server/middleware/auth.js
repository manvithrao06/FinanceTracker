const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Middleware to verify JWT token
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to verify transaction ownership
exports.verifyTransactionOwnership = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns the transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this transaction' });
    }

    // Add transaction to request object
    req.transaction = transaction;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to verify stats access
exports.verifyStatsAccess = async (req, res, next) => {
  try {
    // For stats endpoint, we only need to verify that the user is authenticated
    // The stats query will automatically filter by user ID
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized to access stats' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}; 