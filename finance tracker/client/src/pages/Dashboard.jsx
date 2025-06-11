import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, transactionsResponse] = await Promise.all([
        api.get('/transactions/stats'),
        api.get('/transactions')
      ]);
      setStats(statsResponse.data);
      setTransactions(transactionsResponse.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Current Balance</h3>
          <p className={`mt-2 text-3xl font-semibold ${
            stats?.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${stats?.summary.netBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats?.summary.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            ${stats?.summary.totalExpense.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-end">
        <Link
          to="/transactions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Transaction
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="border-t border-gray-200">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions yet. Add your first transaction!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <li key={transaction._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.category}
                        </p>
                        <p className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p>{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                        {transaction.note && (
                          <p className="ml-4 truncate">• {transaction.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <Link
                        to={`/transactions/${transaction._id}/edit`}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 