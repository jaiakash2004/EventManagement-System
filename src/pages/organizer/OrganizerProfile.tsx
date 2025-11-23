import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { organizerService } from '../../services/organizerService';
import { useAuth } from '../../contexts/AuthContext';
import './OrganizerProfile.css';

const organizerTypes = ['Non-Profit', 'Individual', 'Educational', 'Company'];

const OrganizerProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const { updateUserData } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await organizerService.getOrganizerProfile();
      if (response?.data) {
        const profile = response.data;
        setValue('organizerName', profile.organizerName || '');
        setValue('organizerType', profile.organizerType || '');
        setValue('email', profile.email || '');
        setValue('phone', profile.phone || '');
        setValue('address', profile.address || '');
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
        organizerName: data.organizerName.trim(),
        organizerType: data.organizerType,
        phone: data.phone,
        address: data.address.trim(),
      };

      await organizerService.updateOrganizerProfile(payload);
      
      // Update session storage
      updateUserData({
        organizerName: payload.organizerName,
        organizerType: payload.organizerType,
        phone: payload.phone,
      });
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Failed to update profile.');
    }
  };

  return (
    <div className="container mt-4">
      <h3>Organizer Profile</h3>

      <form onSubmit={handleSubmit(updateProfile)}>
        <div className="mb-3">
          <label className="form-label">OrganizerName</label>
          <input
            type="text"
            className="form-control"
            {...register('organizerName', { required: true, minLength: 3, maxLength: 100 })}
            readOnly={!editMode}
          />
          {errors.organizerName && (
            <small className="form-error">
              Organizer name is required and must be between 3-100 characters
            </small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">OrganizerType</label>
          <select
            className="form-control"
            {...register('organizerType', { required: true })}
            disabled={!editMode}
          >
            <option value="">Select Type</option>
            {organizerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.organizerType && (
            <small className="form-error">Organizer type is required</small>
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
          <label className="form-label">Address</label>
          <input
            type="text"
            className="form-control"
            {...register('address', { required: true, minLength: 10, maxLength: 200 })}
            readOnly={!editMode}
          />
          {errors.address && (
            <small className="form-error">
              Address is required and must be between 10-200 characters
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

export default OrganizerProfile;
