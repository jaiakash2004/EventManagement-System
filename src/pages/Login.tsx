import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data);
      if (response.success) {
        // Get full user profile data
        try {
          const profileResponse = await authService.getProfile();
          const profileData = profileResponse.data || {};
          
          login(
            response.data.token,
            response.data.email,
            response.data.role,
            response.data.name,
            response.data.userId.toString(),
            {
              phone: profileData.phone,
              gender: profileData.gender,
              dob: profileData.dob,
              profilePicture: profileData.profilePicture,
              organizerId: profileData.organizerId?.toString(),
              organizerName: profileData.organizerName,
              organizerType: profileData.organizerType,
            }
          );
        } catch (profileError) {
          // If profile fetch fails, still login with basic data
          login(
            response.data.token,
            response.data.email,
            response.data.role,
            response.data.name,
            response.data.userId.toString()
          );
        }
        
        toast.success(response.message || 'Login successful!', { position: 'top-right' });
        
        // Navigate based on role
        setTimeout(() => {
          navigateBasedOnRole(response.data.role);
        }, 1000);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage, { position: 'top-right' });
    }
  };

  const navigateBasedOnRole = (role: string) => {
    switch (role.toLowerCase()) {
      case 'user':
        navigate('/userDashboard');
        break;
      case 'organizer':
        navigate('/organizerDashboard');
        break;
      case 'admin':
        navigate('/adminDashboard');
        break;
      default:
        navigate('/userDashboard');
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel - Branding */}
      <div className="brand-panel">
        <h1 className="brand-title">Welcome Back</h1>
        <p className="brand-subtitle">Sign in to continue managing your events</p>
      </div>

      {/* Right Panel - Form */}
      <div className="card">
        <h2 className="card-title">Sign In</h2>
        <p className="card-subtitle">Enter your credentials to access your account</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="form-control"
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
              })}
              className="form-control"
              placeholder="••••••••"
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={!isValid}>
            Sign In
          </button>

          <div className="form-footer">
            <a className="link" onClick={() => navigate('/register')}>
              Create Account
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

export default Login;

