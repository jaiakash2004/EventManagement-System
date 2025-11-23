import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import './Register.css';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dob: string;
  profilePicture?: string;
}

const ageValidator = (dob: string): boolean => {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 13;
};

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      toast.success('Registration successful!', { position: 'top-right' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Registration failed',
        { position: 'top-right' }
      );
    }
  };

  return (
    <div className="register-container">
      {/* Left Panel - Branding */}
      <div className="brand-panel">
        <h1 className="brand-title">Event Manager</h1>
        <p className="brand-subtitle">
          Join thousands of users managing amazing events
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="card">
        <h2 className="card-title">Create Account</h2>
        <p className="card-subtitle">Fill in your details to get started</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Name is required' })}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="John Doe"
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/,
                  message:
                    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                },
              })}
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              {...register('phone', {
                required: 'Phone is required',
                minLength: {
                  value: 10,
                  message: 'Phone must be 10 digits',
                },
                maxLength: {
                  value: 10,
                  message: 'Phone must be 10 digits',
                },
              })}
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              placeholder="1234567890"
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              {...register('gender', { required: 'Gender is required' })}
              className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <div className="invalid-feedback">{errors.gender.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              {...register('dob', {
                required: 'Date of Birth is required',
                validate: (value) =>
                  ageValidator(value) || 'You must be at least 13 years old to register',
              })}
              className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
            />
            {errors.dob && (
              <div className="invalid-feedback">{errors.dob.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid}
          >
            Create Account
          </button>

          <div className="form-footer">
            <a className="link" onClick={() => navigate('/login')}>
              Login
            </a>
            <span className="separator">|</span>
            <a className="link" onClick={() => navigate('/organizer/register')}>
              Register as Organizer
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

