import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart colors
const CHART_COLORS = {
  income: '#10B981', // green-500
  expense: '#EF4444', // red-500
  balance: '#3B82F6', // blue-500
  categories: [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
    '#84CC16', // lime-500
  ],
};

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('3m'); // 3m, 6m, 1y, all

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const response = await api.get('/transactions/stats', {
        params: { startDate }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case '3m':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6m':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading charts...</div>
      </div>
    );
  }

  // Prepare data for category pie chart
  const categoryData = {
    labels: stats.categoryData.map(item => item.category),
    datasets: [{
      data: stats.categoryData.map(item => item.expense),
      backgroundColor: CHART_COLORS.categories,
      borderWidth: 1,
    }],
  };

  // Prepare data for monthly bar chart
  const monthlyData = {
    labels: stats.monthlyData.map(item => format(parseISO(item.month), 'MMM yyyy')),
    datasets: [
      {
        label: 'Income',
        data: stats.monthlyData.map(item => item.income),
        backgroundColor: CHART_COLORS.income,
      },
      {
        label: 'Expense',
        data: stats.monthlyData.map(item => item.expense),
        backgroundColor: CHART_COLORS.expense,
      },
    ],
  };

  // Prepare data for balance trend line chart
  const balanceData = {
    labels: stats.monthlyData.map(item => format(parseISO(item.month), 'MMM yyyy')),
    datasets: [{
      label: 'Balance',
      data: stats.monthlyData.map(item => item.balance),
      borderColor: CHART_COLORS.balance,
      tension: 0.1,
      fill: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
          <div className="h-80">
            <Pie data={categoryData} options={chartOptions} />
          </div>
        </div>

        {/* Monthly Income/Expense */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Income vs Expense</h3>
          <div className="h-80">
            <Bar data={monthlyData} options={barOptions} />
          </div>
        </div>

        {/* Balance Trend */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Balance Trend</h3>
          <div className="h-80">
            <Line data={balanceData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats.summary.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            ${stats.summary.totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Net Balance</h3>
          <p className={`mt-2 text-3xl font-semibold ${
            stats.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${stats.summary.netBalance.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
} 