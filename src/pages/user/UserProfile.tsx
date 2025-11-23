import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const { updateUserData } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const dateValidator = (value: string): boolean | string => {
    if (!value) return true;
    const selectedDate = new Date(value);
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - 13);
    const maxAge = new Date();
    maxAge.setFullYear(today.getFullYear() - 120);

    if (selectedDate > minAge) {
      return 'You must be at least 13 years old';
    }
    if (selectedDate < maxAge) {
      return 'Please enter a valid date of birth';
    }
    return true;
  };

  const loadProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response?.data) {
        const profile = response.data;
        setValue('name', profile.name || '');
        setValue('phone', profile.phone || '');
        setValue('gender', profile.gender || '');
        setValue('dob', profile.dob ? profile.dob.split('T')[0] : '');
        setValue('email', profile.email || '');
        setValue('role', profile.role || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const enableEdit = () => {
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    loadProfile();
  };

  const updateProfile = async (data: any) => {
    try {
      const payload = {
        name: data.name.trim(),
        phone: data.phone,
        gender: data.gender,
        dob: data.dob,
        profilePicture: '',
      };

      await userService.updateUserProfile(payload);
      
      // Update session storage
      updateUserData({
        name: payload.name,
        phone: payload.phone,
        gender: payload.gender,
        dob: payload.dob,
        profilePicture: payload.profilePicture,
      });
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || 'Please try again.';
      toast.error(`Failed to update profile: ${errorMessage}`);
    }
  };

  return (
    <div className="container mt-4">
      <h3>User Profile</h3>

      <form onSubmit={handleSubmit(updateProfile)}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            {...register('name', {
              required: true,
              minLength: 3,
              maxLength: 100,
            })}
            readOnly={!editMode}
          />
          {errors.name && (
            <small className="form-error">
              Name is required and must be between 3-100 characters
            </small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input
            type="text"
            className="form-control"
            {...register('phone', {
              required: true,
              pattern: /^[0-9]{10}$/,
            })}
            readOnly={!editMode}
          />
          {errors.phone && (
            <small className="form-error">Phone number must be exactly 10 digits</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Gender</label>
          <select
            className="form-select"
            {...register('gender', { required: true })}
            disabled={!editMode}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <small className="form-error">Gender is required</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Date of Birth</label>
          <input
            type="date"
            className="form-control"
            {...register('dob', {
              required: true,
              validate: dateValidator,
            })}
            readOnly={!editMode}
          />
          {errors.dob && (
            <small className="form-error">
              {errors.dob.message as string || 'Date of birth is required'}
            </small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="text"
            className="form-control"
            {...register('email')}
            readOnly
          />
        </div>

        <div className="text-end">
          {!editMode && (
            <button type="button" className="btn btn-primary" onClick={enableEdit}>
              Edit
            </button>
          )}
          {editMode && (
            <>
              <button type="submit" className="btn btn-success me-2">
                Update
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
