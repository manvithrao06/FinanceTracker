import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Other'
];

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(id);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      type: 'expense',
      amount: '',
      category: '',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  useEffect(() => {
    if (isEditing) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const response = await api.get(`/transactions/${id}`);
      const transaction = response.data;
      setValue('type', transaction.type);
      setValue('amount', transaction.amount);
      setValue('category', transaction.category);
      setValue('note', transaction.note || '');
      setValue('date', format(new Date(transaction.date), 'yyyy-MM-dd'));
    } catch (error) {
      toast.error('Failed to load transaction');
      navigate('/');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/transactions/${id}`, data);
        toast.success('Transaction updated successfully');
      } else {
        await api.post('/transactions', data);
        toast.success('Transaction added successfully');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="mt-1 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="expense"
                    {...register('type', { required: true })}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Expense</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="income"
                    {...register('type', { required: true })}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Income</span>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: {
                      value: 0.01,
                      message: 'Amount must be greater than 0'
                    }
                  })}
                  className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note (optional)
              </label>
              <textarea
                {...register('note')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Add a note about this transaction"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Transaction' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 