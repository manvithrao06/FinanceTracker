import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form for updating profile
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isUpdatingProfile },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Form for updating password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isUpdatingPassword },
    reset: resetPasswordForm,
    watch: watchPassword,
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watchPassword('newPassword');

  // Update profile information
  const onProfileUpdate = async (data) => {
    try {
      await api.put('/auth/profile', data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  // Update password
  const onPasswordUpdate = async (data) => {
    try {
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await api.delete('/auth/profile');
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
        <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              {...registerProfile('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {profileErrors.name && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...registerProfile('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {profileErrors.email && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit(onPasswordUpdate)} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              {...registerPassword('currentPassword', {
                required: 'Current password is required',
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...registerPassword('confirmPassword', {
                required: 'Please confirm your password',
                validate: value =>
                  value === newPassword || 'The passwords do not match',
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-white shadow rounded-lg p-6 border border-red-100">
        <h2 className="text-2xl font-semibold text-red-600 mb-6">Delete Account</h2>
        <p className="text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-600 font-medium">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 