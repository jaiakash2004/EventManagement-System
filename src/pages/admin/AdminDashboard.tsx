import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

interface OrganizerRequest {
  requestId: number;
  trackingToken: string;
  organizerType: string;
  organizerName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
}

interface Organizer {
  organizerId: number;
  organizerName: string;
  organizerType: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  profilePicture: string | null;
  role: string;
  approvalStatus?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('organizers');
  const [organizerRequests, setOrganizerRequests] = useState<OrganizerRequest[]>([]);
  const [organizersList, setOrganizersList] = useState<Organizer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [organizerSearchText, setOrganizerSearchText] = useState('');
  const [selectedOrganizerType, setSelectedOrganizerType] = useState('');
  const [filteredOrganizersList, setFilteredOrganizersList] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showApproveOrganizerConfirm, setShowApproveOrganizerConfirm] = useState(false);
  const [showRejectOrganizerModal, setShowRejectOrganizerModal] = useState(false);
  const [showApproveUserConfirm, setShowApproveUserConfirm] = useState(false);
  const [showRejectUserModal, setShowRejectUserModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrganizerRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(true);
  const [venueRequests, setVenueRequests] = useState<any[]>([]);
  const [showApproveVenueConfirm, setShowApproveVenueConfirm] = useState(false);
  const [showRejectVenueModal, setShowRejectVenueModal] = useState(false);
  const [selectedVenueRequest, setSelectedVenueRequest] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    loadOrganizerRequests();
    loadUsers();
    loadOrganizers();
    loadVenueRequests();
  }, []);

  useEffect(() => {
    applyUserFilters();
  }, [users, searchQuery, showDeactivated]);

  useEffect(() => {
    filterOrganizers();
  }, [organizersList, organizerSearchText, selectedOrganizerType]);

  const loadOrganizerRequests = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getOrganizerRequests();
      console.log('Organizer requests loaded:', data);
      setOrganizerRequests(data);
    } catch (error: any) {
      console.error('Error loading organizer requests:', error);
      if (error.response?.status === 404) {
        toast.warning('Admin organizer requests endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load organizer requests');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers('User', true);
      setUsers(data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      if (error.response?.status === 404) {
        toast.warning('Admin users endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllOrganizersList();
      setOrganizersList(data);
    } catch (error: any) {
      console.error('Error loading organizers:', error);
      if (error.response?.status === 404) {
        toast.warning('Organizers endpoint not implemented in backend yet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenueRequests = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getPendingVenueRequests();
      setVenueRequests(data);
    } catch (error: any) {
      console.error('Error loading venue requests:', error);
      toast.error('Failed to load venue requests');
    } finally {
      setIsLoading(false);
    }
  };

  const applyUserFilters = () => {
    let filtered = [...users];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    if (!showDeactivated) {
      filtered = filtered.filter((user) => !user.isDeleted);
    }

    setFilteredUsers(filtered);
  };

  const filterOrganizers = () => {
    const filtered = organizersList.filter((org) => {
      const matchesSearch =
        (org.organizerName?.toLowerCase().includes(organizerSearchText.toLowerCase().trim())) ||
        (org.email?.toLowerCase().includes(organizerSearchText.toLowerCase().trim())) ||
        (org.phone?.toString().includes(organizerSearchText.trim()));

      if (selectedOrganizerType === '') {
        return matchesSearch;
      }

      const matchesType =
        selectedOrganizerType === '' ||
        org.organizerType === selectedOrganizerType;

      return matchesSearch && matchesType;
    });

    setFilteredOrganizersList(filtered);
  };

  const openApproveConfirm = (request: OrganizerRequest) => {
    setSelectedRequest(request);
    setShowApproveConfirm(true);
  };

  const closeApproveConfirm = () => {
    setShowApproveConfirm(false);
    setSelectedRequest(null);
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;

    try {
      await adminService.approveOrganizerRequest(selectedRequest.requestId);
      toast.success('Organizer request approved successfully');
      closeApproveConfirm();
      loadOrganizerRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      toast.error(errorMessage);
    }
  };

  const openRejectModal = (request: OrganizerRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
    reset();
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    reset();
  };

  const rejectRequest = async (data: any) => {
    if (!selectedRequest) return;

    try {
      await adminService.rejectOrganizerRequest(selectedRequest.requestId, data.rejectionReason);
      toast.success('Organizer request rejected successfully');
      closeRejectModal();
      loadOrganizerRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMessage);
    }
  };

  const openDeactivateConfirm = (user: User) => {
    setSelectedUser(user);
    setShowDeactivateConfirm(true);
  };

  const closeDeactivateConfirm = () => {
    setShowDeactivateConfirm(false);
    setSelectedUser(null);
  };

  const deactivateUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.deactivateUser(selectedUser.userId);
      toast.success('User deactivated successfully');
      closeDeactivateConfirm();
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to deactivate user';
      toast.error(errorMessage);
    }
  };

  const openReactivateConfirm = (user: User) => {
    setSelectedUser(user);
    setShowReactivateConfirm(true);
  };

  const closeReactivateConfirm = () => {
    setShowReactivateConfirm(false);
    setSelectedUser(null);
  };

  const reactivateUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.reactivateUser(selectedUser.userId);
      toast.success('User reactivated successfully');
      closeReactivateConfirm();
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reactivate user';
      toast.error(errorMessage);
    }
  };

  const openApproveOrganizerConfirm = (organizer: Organizer) => {
    setSelectedOrganizer(organizer);
    setShowApproveOrganizerConfirm(true);
  };

  const closeApproveOrganizerConfirm = () => {
    setShowApproveOrganizerConfirm(false);
    setSelectedOrganizer(null);
  };

  const approveOrganizer = async () => {
    if (!selectedOrganizer) return;

    try {
      await adminService.approveOrganizer(selectedOrganizer.organizerId);
      toast.success('Organizer approved successfully');
      closeApproveOrganizerConfirm();
      loadOrganizers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve organizer';
      toast.error(errorMessage);
    }
  };

  const openRejectOrganizerModal = (organizer: Organizer) => {
    setSelectedOrganizer(organizer);
    setShowRejectOrganizerModal(true);
    reset();
  };

  const closeRejectOrganizerModal = () => {
    setShowRejectOrganizerModal(false);
    setSelectedOrganizer(null);
    reset();
  };

  const rejectOrganizer = async (data: any) => {
    if (!selectedOrganizer) return;

    try {
      await adminService.rejectOrganizer(selectedOrganizer.organizerId, data.rejectionReason);
      toast.success('Organizer rejected successfully');
      closeRejectOrganizerModal();
      loadOrganizers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject organizer';
      toast.error(errorMessage);
    }
  };

  const openApproveUserConfirm = (user: User) => {
    setSelectedUser(user);
    setShowApproveUserConfirm(true);
  };

  const closeApproveUserConfirm = () => {
    setShowApproveUserConfirm(false);
    setSelectedUser(null);
  };

  const approveUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.approveUser(selectedUser.userId);
      toast.success('User approved successfully');
      closeApproveUserConfirm();
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve user';
      toast.error(errorMessage);
    }
  };

  const openRejectUserModal = (user: User) => {
    setSelectedUser(user);
    setShowRejectUserModal(true);
    reset();
  };

  const closeRejectUserModal = () => {
    setShowRejectUserModal(false);
    setSelectedUser(null);
    reset();
  };

  const rejectUser = async (data: any) => {
    if (!selectedUser) return;

    try {
      await adminService.rejectUser(selectedUser.userId, data.rejectionReason);
      toast.success('User rejected successfully');
      closeRejectUserModal();
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject user';
      toast.error(errorMessage);
    }
  };

  const openApproveVenueConfirm = (request: any) => {
    setSelectedVenueRequest(request);
    setShowApproveVenueConfirm(true);
  };

  const closeApproveVenueConfirm = () => {
    setShowApproveVenueConfirm(false);
    setSelectedVenueRequest(null);
  };

  const approveVenueRequest = async () => {
    if (!selectedVenueRequest) return;

    try {
      await adminService.reviewVenueRequest(selectedVenueRequest.requestId, { action: 'approve' });
      toast.success('Venue request approved successfully');
      closeApproveVenueConfirm();
      loadVenueRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve venue request';
      toast.error(errorMessage);
    }
  };

  const openRejectVenueModal = (request: any) => {
    setSelectedVenueRequest(request);
    setShowRejectVenueModal(true);
    reset();
  };

  const closeRejectVenueModal = () => {
    setShowRejectVenueModal(false);
    setSelectedVenueRequest(null);
    reset();
  };

  const rejectVenueRequest = async (data: any) => {
    if (!selectedVenueRequest) return;

    try {
      await adminService.reviewVenueRequest(selectedVenueRequest.requestId, {
        action: 'reject',
        comment: data.rejectionReason,
      });
      toast.success('Venue request rejected successfully');
      closeRejectVenueModal();
      loadVenueRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject venue request';
      toast.error(errorMessage);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadOrganizerRequests(),
        loadUsers(),
        loadOrganizers(),
        loadVenueRequests(),
      ]);
      toast.success('Data refreshed successfully!', { position: 'top-right' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>
              <span className="material-icons">people</span>
              Users & Organizers
            </h1>
            <p>Manage organizer requests and user accounts</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: isRefreshing ? '#999' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
          >
            <span className="material-icons" style={{ fontSize: '20px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'organizers' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizers')}
        >
          <span className="material-icons">business</span>
          Organizer Requests ({organizerRequests.length})
        </button>

        <button
          className={`tab ${activeTab === 'organizersList' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizersList')}
        >
          <span className="material-icons">business</span>
          All Organizer List ({organizersList.length})
        </button>

        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="material-icons">group</span>
          All Users ({users.length})
        </button>

        <button
          className={`tab ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          <span className="material-icons">location_on</span>
          Venue Requests ({venueRequests.length})
        </button>
      </div>

      {activeTab === 'organizers' && (
        <div className="tab-content">
          {isLoading && (
            <div className="loading">
              <span className="material-icons spin">hourglass_empty</span>
              <p>Loading...</p>
            </div>
          )}

          {!isLoading && organizerRequests.length === 0 && (
            <div className="empty">
              <span className="material-icons">inbox</span>
              <h3>No Organizer Requests</h3>
              <p>There are no organizer requests.</p>
            </div>
          )}

          {!isLoading && organizerRequests.length > 0 && (
            <div className="grid">
              {organizerRequests.map((request) => (
                <div key={request.requestId} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{request.organizerName}</h3>
                      <span className="badge">{request.trackingToken}</span>
                    </div>
                    <span className={`status ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="detail">
                      <span className="material-icons">category</span>
                      <div>
                        <strong>Type</strong>
                        <p>{request.organizerType}</p>
                      </div>
                    </div>
                    <div className="detail">
                      <span className="material-icons">email</span>
                      <div>
                        <strong>Email</strong>
                        <p>{request.email}</p>
                      </div>
                    </div>
                    <div className="detail">
                      <span className="material-icons">phone</span>
                      <div>
                        <strong>Phone</strong>
                        <p>{request.phone}</p>
                      </div>
                    </div>
                    <div className="detail">
                      <span className="material-icons">location_on</span>
                      <div>
                        <strong>Address</strong>
                        <p>{request.address}</p>
                      </div>
                    </div>
                    <div className="detail">
                      <span className="material-icons">schedule</span>
                      <div>
                        <strong>Submitted</strong>
                        <p>{formatDate(request.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button
                      className="btn btn-success"
                      onClick={() => openApproveConfirm(request)}
                      style={{ flex: 1 }}
                    >
                      <span className="material-icons">check_circle</span>
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => openRejectModal(request)}
                      style={{ flex: 1 }}
                    >
                      <span className="material-icons">cancel</span>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'organizersList' && (
        <div className="tab-content">
          <div className="d-flex gap-3 mb-3 align-items-center">
            <input
              type="text"
              className="form-control"
              placeholder="Search organizers by Name or Email or Phone[Any One]"
              value={organizerSearchText}
              onChange={(e) => setOrganizerSearchText(e.target.value)}
            />

            <select
              className="form-select"
              value={selectedOrganizerType}
              onChange={(e) => setSelectedOrganizerType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Non-Profit">Non-Profit Organization</option>
              <option value="Company">Company</option>
              <option value="Educational">Educational Institution</option>
            </select>
          </div>

          {isLoading && (
            <div className="loading">
              <span className="material-icons spin">hourglass_empty</span>
              <p>Loading...</p>
            </div>
          )}

          {!isLoading && filteredOrganizersList.length === 0 && (
            <div className="empty">
              <span className="material-icons">person_off</span>
              <h3>No Organizers Found</h3>
              <p>No organizers match your search criteria.</p>
            </div>
          )}

          {!isLoading && filteredOrganizersList.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizersList.map((organizer) => (
                    <tr key={organizer.organizerId}>
                      <td>{organizer.organizerName}</td>
                      <td>{organizer.organizerType}</td>
                      <td>{organizer.email}</td>
                      <td>{organizer.phone}</td>
                      <td>{organizer.address}</td>
                      <td>
                        <span className={`status ${getStatusClass(organizer.status)}`}>
                          {organizer.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {organizer.status !== 'Approved' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openApproveOrganizerConfirm(organizer)}
                            >
                              Approve
                            </button>
                          )}
                          {organizer.status !== 'Rejected' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openRejectOrganizerModal(organizer)}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="filter-bar">
            <div className="search">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={showDeactivated}
                onChange={(e) => setShowDeactivated(e.target.checked)}
              />
              Show Deactivated Users
            </label>
          </div>

          {isLoading && (
            <div className="loading">
              <span className="material-icons spin">hourglass_empty</span>
              <p>Loading...</p>
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && (
            <div className="empty">
              <span className="material-icons">person_off</span>
              <h3>No Users Found</h3>
              <p>No users match your search criteria.</p>
            </div>
          )}

          {!isLoading && filteredUsers.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Status</th>
                    <th>Approval</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className={user.isDeleted ? 'deactivated' : ''}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.gender}</td>
                      <td>{formatDateShort(user.dob)}</td>
                      <td>
                        <span
                          className={`status ${user.isDeleted ? 'inactive' : 'active'}`}
                        >
                          {user.isDeleted ? 'Deactivated' : 'Active'}
                        </span>
                      </td>
                      <td>
                        {user.approvalStatus && (
                          <span className={`status ${getStatusClass(user.approvalStatus)}`}>
                            {user.approvalStatus}
                          </span>
                        )}
                        {!user.approvalStatus && (
                          <span className="status status-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {user.approvalStatus !== 'Approved' && !user.isDeleted && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openApproveUserConfirm(user)}
                            >
                              Approve
                            </button>
                          )}
                          {user.approvalStatus !== 'Rejected' && !user.isDeleted && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openRejectUserModal(user)}
                            >
                              Reject
                            </button>
                          )}
                          {!user.isDeleted && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openDeactivateConfirm(user)}
                            >
                              Deactivate
                            </button>
                          )}
                          {user.isDeleted && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openReactivateConfirm(user)}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'venues' && (
        <div className="tab-content">
          {isLoading && (
            <div className="loading">
              <span className="material-icons spin">hourglass_empty</span>
              <p>Loading...</p>
            </div>
          )}

          {!isLoading && venueRequests.length === 0 && (
            <div className="empty">
              <span className="material-icons">location_on</span>
              <h3>No Venue Requests</h3>
              <p>No pending venue requests at the moment.</p>
            </div>
          )}

          {!isLoading && venueRequests.length > 0 && (
            <div className="grid">
              {venueRequests.map((request) => {
                const organizer = organizersList.find((o) => o.organizerId === request.organizerId);
                return (
                  <div key={request.requestId} className="card">
                    <div className="card-header">
                      <div>
                        <h3>{request.name}</h3>
                        <span className="badge">{request.trackingToken}</span>
                      </div>
                      <span className={`status ${getStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="detail">
                        <span className="material-icons">location_on</span>
                        <div>
                          <strong>Location</strong>
                          <p>{request.address}</p>
                        </div>
                      </div>
                      <div className="detail">
                        <span className="material-icons">business</span>
                        <div>
                          <strong>Organizer Name</strong>
                          <p>{organizer?.organizerName || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="detail">
                        <span className="material-icons">email</span>
                        <div>
                          <strong>Email</strong>
                          <p>{organizer?.email || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="detail">
                        <span className="material-icons">people</span>
                        <div>
                          <strong>Capacity</strong>
                          <p>{request.capacity} people</p>
                        </div>
                      </div>
                      <div className="detail">
                        <span className="material-icons">description</span>
                        <div>
                          <strong>Reason</strong>
                          <p>{request.reason}</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-success"
                        onClick={() => openApproveVenueConfirm(request)}
                        style={{ flex: 1 }}
                      >
                        <span className="material-icons">check_circle</span>
                        Accept
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => openRejectVenueModal(request)}
                        style={{ flex: 1 }}
                      >
                        <span className="material-icons">cancel</span>
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showApproveConfirm && (
        <div className="modal" onClick={closeApproveConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <span className="material-icons">check_circle</span>
            </div>
            <h3>Approve Organizer Request?</h3>
            {selectedRequest && (
              <p>
                Are you sure you want to approve the request from
                <strong> {selectedRequest.organizerName}</strong>?
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeApproveConfirm}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={approveRequest}>
                <span className="material-icons">check_circle</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal" onClick={closeRejectModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">cancel</span>
                Reject Organizer Request
              </h3>
              <button className="close" onClick={closeRejectModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit(rejectRequest)}>
              <div className="modal-body">
                {selectedRequest && (
                  <p>
                    Rejecting request from
                    <strong> {selectedRequest.organizerName}</strong>
                  </p>
                )}
                <label>
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  {...register('rejectionReason', { required: true, minLength: 10 })}
                  className="textarea"
                  rows={4}
                  placeholder="Enter reason for rejection (minimum 10 characters)"
                ></textarea>
                {errors.rejectionReason && (
                  <small>Minimum 10 characters required</small>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRejectModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!!errors.rejectionReason}
                >
                  <span className="material-icons">cancel</span>
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeactivateConfirm && (
        <div className="modal" onClick={closeDeactivateConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon danger">
              <span className="material-icons">person_off</span>
            </div>
            <h3>Deactivate User?</h3>
            {selectedUser && (
              <p>
                Are you sure you want to deactivate
                <strong> {selectedUser.name}</strong>?
              </p>
            )}
            <p className="warning">
              This user will no longer be able to access the system.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDeactivateConfirm}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={deactivateUser}>
                <span className="material-icons">person_off</span>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {showReactivateConfirm && (
        <div className="modal" onClick={closeReactivateConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <span className="material-icons">person_add</span>
            </div>
            <h3>Reactivate User?</h3>
            {selectedUser && (
              <p>
                Are you sure you want to reactivate
                <strong> {selectedUser.name}</strong>?
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeReactivateConfirm}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={reactivateUser}>
                <span className="material-icons">person_add</span>
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveOrganizerConfirm && (
        <div className="modal" onClick={closeApproveOrganizerConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <span className="material-icons">check_circle</span>
            </div>
            <h3>Approve Organizer?</h3>
            {selectedOrganizer && (
              <p>
                Are you sure you want to approve
                <strong> {selectedOrganizer.organizerName}</strong>?
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeApproveOrganizerConfirm}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={approveOrganizer}>
                <span className="material-icons">check_circle</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectOrganizerModal && (
        <div className="modal" onClick={closeRejectOrganizerModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">cancel</span>
                Reject Organizer
              </h3>
              <button className="close" onClick={closeRejectOrganizerModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit(rejectOrganizer)}>
              <div className="modal-body">
                {selectedOrganizer && (
                  <p>
                    Rejecting organizer
                    <strong> {selectedOrganizer.organizerName}</strong>
                  </p>
                )}
                <label>
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  {...register('rejectionReason', { required: true, minLength: 10 })}
                  className="textarea"
                  rows={4}
                  placeholder="Enter reason for rejection (minimum 10 characters)"
                ></textarea>
                {errors.rejectionReason && (
                  <small>Minimum 10 characters required</small>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRejectOrganizerModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!!errors.rejectionReason}
                >
                  <span className="material-icons">cancel</span>
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApproveUserConfirm && (
        <div className="modal" onClick={closeApproveUserConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <span className="material-icons">check_circle</span>
            </div>
            <h3>Approve User?</h3>
            {selectedUser && (
              <p>
                Are you sure you want to approve
                <strong> {selectedUser.name}</strong>?
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeApproveUserConfirm}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={approveUser}>
                <span className="material-icons">check_circle</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectUserModal && (
        <div className="modal" onClick={closeRejectUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">cancel</span>
                Reject User
              </h3>
              <button className="close" onClick={closeRejectUserModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit(rejectUser)}>
              <div className="modal-body">
                {selectedUser && (
                  <p>
                    Rejecting user
                    <strong> {selectedUser.name}</strong>
                  </p>
                )}
                <label>
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  {...register('rejectionReason', { required: true, minLength: 10 })}
                  className="textarea"
                  rows={4}
                  placeholder="Enter reason for rejection (minimum 10 characters)"
                ></textarea>
                {errors.rejectionReason && (
                  <small>Minimum 10 characters required</small>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRejectUserModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!!errors.rejectionReason}
                >
                  <span className="material-icons">cancel</span>
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApproveVenueConfirm && (
        <div className="modal" onClick={closeApproveVenueConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <span className="material-icons">check_circle</span>
            </div>
            <h3>Approve Venue Request?</h3>
            {selectedVenueRequest && (
              <p>
                Are you sure you want to approve the venue request for
                <strong> {selectedVenueRequest.name}</strong>?
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeApproveVenueConfirm}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={approveVenueRequest}>
                <span className="material-icons">check_circle</span>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectVenueModal && (
        <div className="modal" onClick={closeRejectVenueModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">cancel</span>
                Reject Venue Request
              </h3>
              <button className="close" onClick={closeRejectVenueModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit(rejectVenueRequest)}>
              <div className="modal-body">
                {selectedVenueRequest && (
                  <p>
                    Rejecting venue request for
                    <strong> {selectedVenueRequest.name}</strong>
                  </p>
                )}
                <label>
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  {...register('rejectionReason', { required: true, minLength: 10 })}
                  className="textarea"
                  rows={4}
                  placeholder="Enter reason for rejection (minimum 10 characters)"
                ></textarea>
                {errors.rejectionReason && (
                  <small>Minimum 10 characters required</small>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRejectVenueModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!!errors.rejectionReason}
                >
                  <span className="material-icons">cancel</span>
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
