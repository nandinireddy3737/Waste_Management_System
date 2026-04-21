import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import WorkerLogin from './WorkerLogin';
import WorkerSignup from './WorkerSignup';
import CitizenMongoComplaints from './CitizenMongoComplaints';
import OfficerComplaintsManagement from './OfficerComplaintsManagement';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authType, setAuthType] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMongoComplaints, setShowMongoComplaints] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [workerId, setWorkerId] = useState('');
  
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setUserName(signUpData.fullName);
    setIsLoggedIn(true);
    setAuthType(null);
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'officer') {
      setUserName('Municipal Officer');
    } else if (selectedRole === 'worker') {
      setUserName('Worker');
    } else {
      setUserName('Citizen');
    }
    setIsLoggedIn(true);
    setAuthType(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowMongoComplaints(false);
    setAuthType(null);
    setSelectedRole(null);
    setSelectedSection(null);
    setUserName('');
    setWorkerId('');
    setSignUpData({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: '',
      confirmPassword: ''
    });
    setSignInData({ email: '', password: '' });
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'officer') {
      setAuthType('signin');
    } else if (role === 'worker') {
      navigate('/worker-login');
    }
  };

  // Worker Login page (standalone route)
  if (location.pathname === '/worker-login') {
    return <WorkerLogin />;
  }

  // Worker Sign Up page
  if (location.pathname === '/worker-signup') {
    return <WorkerSignup />;
  }

  // Worker Dashboard (after login via /api/worker/login)
  if (location.pathname === '/worker-dashboard') {
    return <WorkerDashboardRoute />;
  }

  // Officer: routed municipal dashboard and table pages
  if (isLoggedIn && selectedRole === 'officer') {
    return (
      <OfficerLayout>
          <Routes>
            <Route
              path="/municipal"
              element={<MunicipalDashboard userName={userName} onLogout={handleLogout} />}
            />
            <Route path="/city-zones" element={<CityZonePage />} />
            <Route path="/waste-bins" element={<WasteBinPage />} />
            <Route path="/collection-vehicles" element={<CollectionVehiclePage />} />
            <Route path="/vehicle-worker-assignments" element={<VehicleAssignmentPage />} />
            <Route path="/collection-schedules" element={<CollectionSchedulePage />} />
            {/* Fallback to dashboard for any other path (including initial '/') */}
            <Route
              path="*"
              element={<MunicipalDashboard userName={userName} onLogout={handleLogout} />}
            />
          </Routes>
        </OfficerLayout>
    );
  }

  // Worker: dedicated operational dashboard (legacy flow - when worker uses generic signin)
  if (isLoggedIn && selectedRole === 'worker') {
    return (
        <WorkerDashboard
          userName={userName}
          onLogout={handleLogout}
          workerId={workerId}
          setWorkerId={setWorkerId}
        />
    );
  }

  // Citizen dashboard (complaints)
  if (isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.dashboardCard}>
          <h1 style={styles.dashboardTitle}>Citizen Dashboard</h1>
          <p style={styles.welcomeMessage}>Welcome, {userName || 'Citizen'}!</p>
          
          {showMongoComplaints ? (
            <CitizenMongoComplaints
              userName={userName}
              onBack={() => setShowMongoComplaints(false)}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowMongoComplaints(true)}
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.3)';
                }}
              >
                Citizen Complaints
              </button>
              <button
                onClick={handleLogout}
                style={styles.logoutButton}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (authType === 'signup') {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <h1 style={styles.authTitle}>Citizen Sign Up</h1>
          <p style={styles.authSubtitle}>Create your account to access citizen services</p>
          
          <form onSubmit={handleSignUpSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={signUpData.fullName}
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                style={styles.input}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                style={styles.input}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={signUpData.phoneNumber}
                onChange={(e) => setSignUpData({ ...signUpData, phoneNumber: e.target.value })}
                style={styles.input}
                placeholder="Enter your phone number"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <input
                type="text"
                value={signUpData.address}
                onChange={(e) => setSignUpData({ ...signUpData, address: e.target.value })}
                style={styles.input}
                placeholder="Enter your address"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                style={styles.input}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button type="submit" style={styles.submitButton}>
              Create Citizen Account
            </button>
            
            <button
              type="button"
              onClick={() => {
                setAuthType(null);
                setSelectedRole(null);
              }}
              style={styles.backButton}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authType === 'signin') {
    const roleTitle = selectedRole === 'officer' ? 'Municipal Officer Sign In' : 
                     selectedRole === 'worker' ? 'Worker Sign In' : 'Citizen Sign In';
    const roleSubtitle = selectedRole === 'officer' ? 'Sign in to access administrative portal' :
                        selectedRole === 'worker' ? 'Sign in to access operational portal' :
                        'Sign in to access your account';
    
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <h1 style={styles.authTitle}>{roleTitle}</h1>
          <p style={styles.authSubtitle}>{roleSubtitle}</p>
          
          <form onSubmit={handleSignInSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                style={styles.input}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button type="submit" style={styles.submitButton}>
              Login
            </button>
            
            <button
              type="button"
              onClick={() => {
                setAuthType(null);
                setSelectedRole(null);
              }}
              style={styles.backButton}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.welcomeCard}>
        <h1 style={styles.mainTitle}>Urban Waste Management System</h1>
        <p style={styles.subtitle}>Select your role to continue</p>
        
        <div style={styles.rolesGrid}>
          <div style={styles.citizenSection}>
            <h2 style={styles.sectionTitle}>Citizen</h2>
            <p style={styles.sectionNote}>Only Citizens can create accounts</p>
            <div style={styles.citizenButtons}>
              <button
                onClick={() => setAuthType('signup')}
                style={styles.citizenButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                }}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setSelectedRole('citizen');
                  setAuthType('signin');
                }}
                style={styles.citizenButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                }}
              >
                Sign In
              </button>
            </div>
          </div>

          <div 
            style={styles.roleCard}
            onClick={() => handleRoleSelect('officer')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(80, 200, 120, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{...styles.roleIcon, backgroundColor: 'rgba(80, 200, 120, 0.2)'}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h2 style={styles.roleTitle}>Municipal Officer</h2>
            <p style={styles.roleDescription}>Added by Admin</p>
            <p style={styles.roleSubtext}>Sign In Only</p>
          </div>

          <div 
            style={styles.roleCard}
            onClick={() => handleRoleSelect('worker')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 107, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{...styles.roleIcon, backgroundColor: 'rgba(255, 107, 107, 0.2)'}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2 style={styles.roleTitle}>Worker</h2>
            <p style={styles.roleDescription}>Added by Admin</p>
            <p style={styles.roleSubtext}>Sign In Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Worker Dashboard Route: protects /worker-dashboard, reads session from Worker Login
function WorkerDashboardRoute() {
  const navigate = useNavigate();
  const [workerId, setWorkerIdState] = useState(() => sessionStorage.getItem('workerId') || '');
  const workerName = sessionStorage.getItem('workerName') || 'Worker';

  useEffect(() => {
    if (!workerId || !String(workerId).trim()) {
      navigate('/worker-login');
    }
  }, [workerId, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('workerId');
    sessionStorage.removeItem('workerName');
    navigate('/');
  };

  const setWorkerId = (id) => {
    const value = id ? String(id).trim() : '';
    setWorkerIdState(value);
    if (value) sessionStorage.setItem('workerId', value);
    else sessionStorage.removeItem('workerId');
  };

  if (!workerId || !String(workerId).trim()) {
    return null;
  }

  return (
    <WorkerDashboard
      userName={workerName}
      onLogout={handleLogout}
      workerId={workerId}
      setWorkerId={setWorkerId}
    />
  );
}

// Worker Dashboard - modern UI with top nav, info card, progress, and tasks table
function WorkerDashboard({ userName, onLogout, workerId, setWorkerId }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [quantityInputs, setQuantityInputs] = useState({});
  const [progressData, setProgressData] = useState({ total: 0, completed: 0 });

  const hasWorkerId = Boolean(workerId && String(workerId).trim());

  const loadTodayTasks = async () => {
    if (!hasWorkerId) return;
    setIsLoading(true);
    setError(null);
    setTasks([]);
    try {
      const tasksRes = await fetch(`http://localhost:5000/api/worker/tasks?worker_id=${encodeURIComponent(workerId)}`);
      if (!tasksRes.ok) throw new Error('Failed to load today tasks');
      const tasksData = await tasksRes.json();

      // Check for special message from backend
      if (tasksData && tasksData.message) {
        setError(tasksData.message);
        setVehicleInfo(null);
        return;
      }

      if (Array.isArray(tasksData)) {
        const tasksForToday = tasksData.map(t => ({
          ...t,
          status: String(t.schedule_status || '').toLowerCase() === 'completed' ? 'Completed' : 'Pending'
        }));
        setTasks(tasksForToday);

        // Get vehicle from the first task if available
        if (tasksForToday.length > 0) {
          setVehicleInfo({ vehicle_id: tasksForToday[0].vehicle_id });
          const progRes = await fetch(`http://localhost:5000/api/worker/progress?vehicle_id=${encodeURIComponent(tasksForToday[0].vehicle_id)}`);
          if (progRes.ok) {
            const progDat = await progRes.json();
            setProgressData(progDat);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('No tasks could be loaded for today. Please ensure data is configured for this worker.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayTasks();
  }, [hasWorkerId, workerId]);

  const handleWorkerIdSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const value = form.workerId && form.workerId.value ? form.workerId.value.trim() : '';
    if (!value) {
      window.alert('Please enter your Worker ID.');
      return;
    }
    setWorkerId(value);
  };

  const handleQuantityChange = (scheduleId, value) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [scheduleId]: value
    }));
  };

  const handleMarkCollected = async (task) => {
    if (!task || !task.schedule_id) return;

    const quantityValue = quantityInputs[task.schedule_id];
    const collectedQuantity =
      quantityValue !== undefined && quantityValue !== null && String(quantityValue).trim() !== ''
        ? Number(quantityValue)
        : 0;

    try {
      const res = await fetch('http://localhost:5000/api/worker/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: task.schedule_id
        })
      });

      if (!res.ok) {
        throw new Error('Failed to mark task as completed');
      }

      // Refresh data from backend to ensure UI synchronization
      await loadTodayTasks();
      
    } catch (err) {
      console.error(err);
      window.alert('Failed to mark task as completed. Please check backend / DB.');
    }
  };

  const totalTasks = progressData.total;
  const completedTasks = progressData.completed;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      setWorkerId('');
    }
  };

  return (
    <div style={workerStyles.page}>
      <style>{`
        @media (max-width: 600px) {
          .worker-nav { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px; }
          .worker-nav-title { font-size: 18px !important; width: 100%; text-align: center; order: -1; }
          .worker-main { padding: 16px !important; }
          .worker-card { padding: 20px 16px !important; }
        }
      `}</style>
      {/* Top Navigation Bar */}
      <nav className="worker-nav" style={workerStyles.topNav}>
        <button
          type="button"
          onClick={handleBack}
          style={workerStyles.navBackBtn}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1 className="worker-nav-title" style={workerStyles.navTitle}>Worker Dashboard</h1>
        <button
          type="button"
          onClick={onLogout}
          style={workerStyles.navLogoutBtn}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(211,47,47,0.9)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(211,47,47,0.7)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Logout
        </button>
      </nav>

      <main className="worker-main" style={workerStyles.main}>
        {!hasWorkerId && (
          <section className="worker-card" style={workerStyles.card}>
            <h2 style={workerStyles.cardTitle}>Enter Worker ID</h2>
            <p style={workerStyles.cardSubtext}>
              To load today&apos;s collection tasks, please enter your Worker ID.
            </p>
            <form onSubmit={handleWorkerIdSubmit} style={workerStyles.workerIdForm}>
              <input
                type="text"
                name="workerId"
                placeholder="e.g., W001"
                style={workerStyles.input}
                defaultValue={workerId}
                required
              />
              <button
                type="submit"
                style={workerStyles.btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1565c0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1976d2'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Load Tasks
              </button>
            </form>
          </section>
        )}

        {hasWorkerId && (
          <>
            {/* Section 1: Worker Information Card */}
            <section className="worker-card" style={workerStyles.card}>
              <h2 style={workerStyles.cardTitle}>Worker Information</h2>
              <div style={workerStyles.infoGrid}>
                <div style={workerStyles.infoItem}>
                  <span style={workerStyles.infoLabel}>Worker ID</span>
                  <span style={workerStyles.infoValue}>{workerId}</span>
                </div>
                <div style={workerStyles.infoItem}>
                  <span style={workerStyles.infoLabel}>Assigned Vehicle</span>
                  <span style={workerStyles.infoValue}>
                    {vehicleInfo ? (vehicleInfo.vehicle_id || vehicleInfo.vehicle_number || 'N/A') : '—'}
                  </span>
                </div>
                <div style={workerStyles.infoItem}>
                  <span style={workerStyles.infoLabel}>Welcome</span>
                  <span style={workerStyles.infoValue}>Welcome, {userName || 'Worker'}!</span>
                </div>
              </div>
            </section>

            {/* Section 2: Progress Card */}
            <section className="worker-card" style={workerStyles.card}>
              <h2 style={workerStyles.cardTitle}>Today&apos;s Progress</h2>
              <div style={workerStyles.progressText}>
                Progress: <strong>{completedTasks} / {totalTasks}</strong> tasks completed
              </div>
              <div style={workerStyles.progressBarBg}>
                <div
                  style={{
                    ...workerStyles.progressBarFill,
                    width: `${progressPercent}%`
                  }}
                />
              </div>
            </section>

            {/* Section 3: Today's Collection Tasks */}
            <section className="worker-card" style={workerStyles.card}>
              <h2 style={workerStyles.cardTitle}>Today&apos;s Collection Tasks</h2>

              {isLoading && (
                <div style={workerStyles.tableMessage}>Loading today&apos;s tasks...</div>
              )}
              {error && !isLoading && (
                <div style={workerStyles.errorMessage}>{error}</div>
              )}

              {!isLoading && !error && (
                <div style={workerStyles.tableWrapper}>
                  <table style={workerStyles.table}>
                    <thead>
                      <tr>
                        <th style={workerStyles.th}>Bin ID</th>
                        <th style={workerStyles.th}>Location</th>
                        <th style={workerStyles.th}>Waste Type</th>
                        <th style={workerStyles.th}>Scheduled Time</th>
                        <th style={workerStyles.th}>Status</th>
                        <th style={workerStyles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length > 0 ? (
                        tasks.map((task) => {
                          const isCompleted = String(task.status || '').toLowerCase() === 'completed';
                          return (
                            <tr
                              key={task.schedule_id || `${task.bin_id}-${task.schedule_time}`}
                              style={workerStyles.tr}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <td style={workerStyles.td}>{task.bin_id}</td>
                              <td style={workerStyles.td}>{task.location || task.bin_location || '—'}</td>
                              <td style={workerStyles.td}>{task.waste_type || '—'}</td>
                              <td style={workerStyles.td}>{task.schedule_time}</td>
                              <td style={workerStyles.td}>
                                <span
                                  style={{
                                    ...workerStyles.badge,
                                    ...(isCompleted ? workerStyles.badgeCompleted : workerStyles.badgePending)
                                  }}
                                >
                                  {isCompleted ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td style={workerStyles.td}>
                                {isCompleted ? (
                                  <span style={workerStyles.doneText}>Done</span>
                                ) : (
                                  <div style={workerStyles.actionsCell}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      placeholder="Qty"
                                      value={quantityInputs[task.schedule_id] ?? ''}
                                      onChange={(e) => handleQuantityChange(task.schedule_id, e.target.value)}
                                      style={workerStyles.qtyInput}
                                    />
                                    <button
                                      type="button"
                                      style={workerStyles.btnComplete}
                                      onClick={() => handleMarkCollected(task)}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1b5e20'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = '#2e7d32'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      Complete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td style={workerStyles.emptyCell} colSpan="6">
                            ✓ No collection tasks scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const workerStyles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #43a047 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)'
  },
  navBackBtn: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  navTitle: {
    margin: 0,
    fontSize: 'clamp(18px, 3vw, 24px)',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  navLogoutBtn: {
    background: 'rgba(211, 47, 47, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 20px'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1b5e20'
  },
  cardSubtext: {
    margin: '0 0 16px 0',
    color: '#555',
    fontSize: '15px'
  },
  workerIdForm: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    maxWidth: '420px'
  },
  input: {
    flex: '1 1 200px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #bdbdbd',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  btnPrimary: {
    background: '#1976d2',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  btnComplete: {
    background: '#2e7d32',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#757575',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '16px',
    color: '#212121',
    fontWeight: '500'
  },
  progressText: {
    fontSize: '15px',
    color: '#424242',
    marginBottom: '10px'
  },
  progressBarBg: {
    height: '10px',
    borderRadius: '999px',
    background: '#e0e0e0',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #43a047, #2e7d32)',
    transition: 'width 0.3s ease'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid #e0e0e0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    color: '#fff',
    background: '#2e7d32'
  },
  tr: {
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#212121',
    borderBottom: '1px solid #eee'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600'
  },
  badgePending: {
    background: 'rgba(255, 193, 7, 0.25)',
    color: '#f57f17'
  },
  badgeCompleted: {
    background: 'rgba(46, 125, 50, 0.2)',
    color: '#2e7d32'
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  qtyInput: {
    width: '80px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #bdbdbd',
    fontSize: '14px',
    outline: 'none'
  },
  doneText: {
    fontSize: '14px',
    color: '#2e7d32',
    fontWeight: '600'
  },
  emptyCell: {
    padding: '48px 24px',
    textAlign: 'center',
    fontSize: '16px',
    color: '#616161',
    borderBottom: 'none'
  },
  tableMessage: {
    padding: '24px',
    textAlign: 'center',
    color: '#616161',
    fontSize: '15px'
  },
  errorMessage: {
    padding: '16px',
    borderRadius: '10px',
    background: 'rgba(255, 183, 77, 0.2)',
    color: '#e65100',
    fontSize: '14px'
  }
};

function OfficerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      label: 'Dashboard', 
      path: '/municipal', 
      key: 'dashboard',
      icon: '📊'
    },
    { 
      label: 'City Zones', 
      path: '/city-zones', 
      key: 'zones',
      icon: '🏙️'
    },
    { 
      label: 'Waste Bins', 
      path: '/waste-bins', 
      key: 'bins',
      icon: '🗑️'
    },
    { 
      label: 'Collection Vehicles', 
      path: '/collection-vehicles', 
      key: 'vehicles',
      icon: '🚛'
    },
    { 
      label: 'Vehicle–Worker Assignments', 
      path: '/vehicle-worker-assignments', 
      key: 'assignments',
      icon: '👥'
    },
    { 
      label: 'Collection Schedule', 
      path: '/collection-schedules', 
      key: 'schedules',
      icon: '📅'
    }
  ];

  return (
    <div style={styles.officerShell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoCircle}>MW</div>
          <div>
            <div style={styles.sidebarTitle}>Municipal Waste</div>
            <div style={styles.sidebarSubtitle}>Officer Console</div>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.sidebarNavItem,
                  ...(active ? styles.sidebarNavItemActive : {})
                }}
              >
                <span style={styles.sidebarNavIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={styles.officerMain}>{children}</main>
    </div>
  );
}

// Municipal Officer dashboard (summary cards driven by SQL)
function MunicipalDashboard({ userName, onLogout }) {
  const navigate = useNavigate();
  const [showOfficerComplaints, setShowOfficerComplaints] = useState(false);

  const [summary, setSummary] = useState({
    total_zones: 0,
    total_bins: 0,
    total_vehicles: 0,
    active_schedules: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cards = [
    {
      key: 'zones',
      label: 'Total City Zones',
      valueKey: 'total_zones',
      path: '/city-zones'
    },
    {
      key: 'bins',
      label: 'Total Waste Bins',
      valueKey: 'total_bins',
      path: '/waste-bins'
    },
    {
      key: 'vehicles',
      label: 'Total Collection Vehicles',
      valueKey: 'total_vehicles',
      path: '/collection-vehicles'
    },
    {
      key: 'schedules',
      label: 'Active Collection Schedules',
      valueKey: 'active_schedules',
      path: '/collection-schedules'
    }
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:5000/api/dashboard-summary');
        if (!res.ok) throw new Error('Failed to load dashboard summary');
        const data = await res.json();
        setSummary(data || {});
      } catch (err) {
        console.error(err);
        setError('Unable to load dashboard summary. Please check backend / DB.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div style={styles.dashboardPage}>
      <header style={styles.dashboardHeader}>
        <div>
          <h1 style={styles.officerDashboardTitle}>Municipal Officer Dashboard</h1>
          <p style={styles.officerWelcomeMessage}>
            Welcome, {userName || 'Municipal Officer'}.
          </p>
        </div>
        <button onClick={onLogout} style={styles.officerLogoutButton}>
          Logout
        </button>
      </header>

      {showOfficerComplaints ? (
        <OfficerComplaintsManagement onBack={() => setShowOfficerComplaints(false)} />
      ) : (
        <>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowOfficerComplaints(true)}
              style={{
                ...styles.summaryCard,
                maxWidth: '320px',
                margin: '0 auto',
                padding: '16px 24px',
                cursor: 'pointer',
                border: '2px solid rgba(129, 199, 132, 0.6)'
              }}
            >
              <div style={{ ...styles.summaryLabel, fontSize: '16px', fontWeight: '600' }}>
                Citizen Complaints
              </div>
              <div style={{ ...styles.summaryLabel, fontSize: '12px', opacity: 0.85, marginTop: '6px' }}>
              
              </div>
            </button>
          </div>

          {loading && <div style={styles.tableMessage}>Loading summary from MySQL…</div>}
          {error && !loading && (
            <div
              style={{
                ...styles.tableMessage,
                color: '#ffebee',
                backgroundColor: 'rgba(211, 47, 47, 0.35)'
              }}
            >
              {error}
            </div>
          )}

          <section style={styles.summaryGrid}>
            {cards.map((card) => (
              <button
                key={card.key}
                style={styles.summaryCard}
                onClick={() => navigate(card.path)}
              >
                <div style={styles.summaryValue}>
                  {summary[card.valueKey] !== undefined ? summary[card.valueKey] : '—'}
                </div>
                <div style={styles.summaryLabel}>{card.label}</div>
              </button>
            ))}
          </section>

          <SmartInsightsSection />

          <Neo4jGraphInsightsSection />

          <DashboardScheduleExplorer />
        </>
      )}
    </div>
  );
}

function SmartInsightsSection() {
  const [priorityBins, setPriorityBins] = useState([]);
  const [dailyReport, setDailyReport] = useState({});
  const [overloadedVehicles, setOverloadedVehicles] = useState([]);
  const [idleWorkers, setIdleWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const [pb, dr, ov, iw] = await Promise.all([
          fetch('http://localhost:5000/api/insights/priority-bins').then(r => r.json()),
          fetch('http://localhost:5000/api/insights/daily-report').then(r => r.json()),
          fetch('http://localhost:5000/api/insights/overloaded-vehicles').then(r => r.json()),
          fetch('http://localhost:5000/api/insights/idle-workers').then(r => r.json()),
        ]);
        setPriorityBins(pb);
        setDailyReport(dr);
        setOverloadedVehicles(ov);
        setIdleWorkers(iw);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <section style={styles.insightsSection}>
      <h2 style={styles.insightsTitle}>🚨 Smart Insights</h2>
      
      <div style={styles.insightsGrid}>
        <div style={styles.insightCard}>
          <h3 style={styles.insightCardTitle}>Daily Collection Report</h3>
          <div style={styles.reportStats}>
             <div style={styles.statItem}>
               <span style={styles.statVal}>{dailyReport.total_tasks_today || 0}</span>
               <span style={styles.statLab}>Total Tasks</span>
             </div>
             <div style={styles.statItem}>
               <span style={{...styles.statVal, color: '#C8E6C9'}}>{dailyReport.completed_tasks || 0}</span>
               <span style={styles.statLab}>Completed</span>
             </div>
             <div style={styles.statItem}>
               <span style={{...styles.statVal, color: '#FFCCBC'}}>{dailyReport.pending_tasks || 0}</span>
               <span style={styles.statLab}>Pending</span>
             </div>
          </div>
        </div>

        <div style={styles.insightCard}>
          <h3 style={styles.insightCardTitle}>Overloaded Vehicles ({'>'}5 Tasks)</h3>
          <div style={styles.listContainer}>
            {overloadedVehicles.length > 0 ? overloadedVehicles.map(v => (
              <div key={v.vehicle_id} style={styles.listItem}>
                <span>Vehicle: {v.vehicle_id}</span>
                <span style={{color: '#ff5252'}}>Tasks: {v.total_tasks}</span>
              </div>
            )) : <p style={styles.emptyMsg}>None</p>}
          </div>
        </div>

        <div style={styles.insightCard}>
          <h3 style={styles.insightCardTitle}>Priority Bins (Full & No Schedule)</h3>
          <div style={styles.listContainer}>
            {priorityBins.length > 0 ? priorityBins.map(b => (
              <div key={b.bin_id} style={styles.listItem}>
                <span>Bin: {b.bin_id}</span>
                <span style={styles.listSub}>{b.location}</span>
              </div>
            )) : <p style={styles.emptyMsg}>None</p>}
          </div>
        </div>

        <div style={styles.insightCard}>
          <h3 style={styles.insightCardTitle}>Idle Workers</h3>
          <div style={styles.listContainer}>
            {idleWorkers.length > 0 ? idleWorkers.map(w => (
              <div key={w.worker_id} style={styles.listItem}>
                <span>Worker: {w.worker_id}</span>
                <span style={styles.listSub}>Vehicle: {w.vehicle_id}</span>
              </div>
            )) : <p style={styles.emptyMsg}>None</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

// Neo4j Graph Insights — additive module for relationship-based queries
function Neo4jGraphInsightsSection() {
  const [activeTab, setActiveTab] = useState('worker');
  const [queryInput, setQueryInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graphSummary, setGraphSummary] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [workerLoad, setWorkerLoad] = useState([]);
  const [workerLoadLoading, setWorkerLoadLoading] = useState(false);

  const tabs = [
    { key: 'worker', label: 'Worker Load Analysis', icon: '📊', placeholder: '' },
    { key: 'vehicle', label: 'Vehicle → Route → Bins', icon: '🚛', placeholder: 'Enter Vehicle ID (e.g., 201)' },
    { key: 'zone', label: 'Zone → Bins', icon: '🏙️', placeholder: 'Enter Zone Name (e.g., Gandhipuram)' }
  ];

  const fetchGraphSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('http://localhost:5000/neo4j/graph-summary');
      if (!res.ok) throw new Error('Failed to fetch graph summary');
      const data = await res.json();
      setGraphSummary(data);
    } catch (err) {
      console.error('Graph summary error:', err);
      setGraphSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchWorkerLoad = async () => {
    setWorkerLoadLoading(true);
    try {
      const res = await fetch('http://localhost:5000/neo4j/worker-load');
      if (!res.ok) throw new Error('Failed to fetch worker load');
      const data = await res.json();
      setWorkerLoad(data || []);
    } catch (err) {
      console.error('Worker load error:', err);
      setWorkerLoad([]);
    } finally {
      setWorkerLoadLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphSummary();
    fetchWorkerLoad();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // Backend directly fetches from MySQL and populates Neo4j
      const syncRes = await fetch('http://localhost:5000/neo4j/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Sync failed');
      }
      const result = await syncRes.json();
      setSyncMessage(result.message || 'Graph synced successfully!');
      // Refresh summary after sync
      await fetchGraphSummary();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncMessage('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleQuery = async () => {
    if (!queryInput.trim()) {
      setError('Please enter a value to query.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      let endpoint = '';
      const encoded = encodeURIComponent(queryInput.trim());
      if (activeTab === 'worker') endpoint = `/neo4j/worker-bins/${encoded}`;
      else if (activeTab === 'vehicle') endpoint = `/neo4j/vehicle-bins/${encoded}`;
      else if (activeTab === 'zone') endpoint = `/neo4j/zone-bins/${encoded}`;

      const res = await fetch(`http://localhost:5000${endpoint}`);
      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();
      setResults(data || []);
      if (data.length === 0) setError('No relationships found for this query.');
    } catch (err) {
      console.error('Neo4j query error:', err);
      setError('Failed to query Neo4j. Make sure Neo4j is running and data is synced.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    setQueryInput('');
    setResults([]);
    setError(null);
    if (tabKey === 'worker') fetchWorkerLoad();
  };

  const currentTab = tabs.find(t => t.key === activeTab);

  const renderResults = () => {
    if (results.length === 0) return null;

    if (activeTab === 'worker') {
      return null; // Worker tab uses workerLoad, not renderResults
    }

    if (activeTab === 'vehicle') {
      return (
        <div style={styles.neo4jResultsGrid}>
          {results.map((r, i) => (
            <div key={i} style={styles.neo4jResultCard}>
              <div style={styles.neo4jResultChain}>
                <span style={{...styles.neo4jNodeBadge, background: 'rgba(25, 118, 210, 0.25)', borderColor: 'rgba(100, 181, 246, 0.5)'}}>
                  <span style={styles.neo4jNodeIcon}>🚛</span>
                  {r.vehicle?.vehicle_id}
                </span>
                <span style={styles.neo4jArrow}>→</span>
                <span style={{...styles.neo4jNodeBadge, background: 'rgba(0, 150, 136, 0.25)', borderColor: 'rgba(77, 208, 225, 0.5)'}}>
                  <span style={styles.neo4jNodeIcon}>🛣️</span>
                  {r.route?.route_id || 'Route'}
                </span>
                <span style={styles.neo4jArrow}>→</span>
                <span style={{...styles.neo4jNodeBadge, background: 'rgba(255, 152, 0, 0.2)', borderColor: 'rgba(255, 183, 77, 0.5)'}}>
                  <span style={styles.neo4jNodeIcon}>🗑️</span>
                  {r.bin?.bin_id}
                </span>
              </div>
              <div style={styles.neo4jResultDetails}>
                <span>📍 {r.bin?.location || '—'}</span>
                <span>♻️ {r.bin?.waste_type || '—'}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: r.bin?.bin_status === 'Full' ? 'rgba(211,47,47,0.3)' : 'rgba(46,125,50,0.3)',
                  color: r.bin?.bin_status === 'Full' ? '#ef9a9a' : '#a5d6a7'
                }}>{r.bin?.bin_status || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'zone') {
      return (
        <div style={styles.neo4jResultsGrid}>
          {results.map((r, i) => (
            <div key={i} style={styles.neo4jResultCard}>
              <div style={styles.neo4jResultChain}>
                <span style={{...styles.neo4jNodeBadge, background: 'rgba(156, 39, 176, 0.2)', borderColor: 'rgba(186, 104, 200, 0.5)'}}>
                  <span style={styles.neo4jNodeIcon}>🏙️</span>
                  {r.zone?.zone_name}
                </span>
                <span style={styles.neo4jArrow}>→</span>
                <span style={{...styles.neo4jNodeBadge, background: 'rgba(255, 152, 0, 0.2)', borderColor: 'rgba(255, 183, 77, 0.5)'}}>
                  <span style={styles.neo4jNodeIcon}>🗑️</span>
                  {r.bin?.bin_id}
                </span>
              </div>
              <div style={styles.neo4jResultDetails}>
                <span>📍 {r.bin?.location || '—'}</span>
                <span>♻️ {r.bin?.waste_type || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <section style={styles.neo4jSection}>
      {/* Section header */}
      <div style={styles.neo4jHeader}>
        <div>
          <h2 style={styles.neo4jTitle}>🔗 Graph Insights</h2>
          <p style={styles.neo4jSubtitle}>Neo4j relationship-based queries across Workers, Vehicles, Bins & Zones</p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          style={{
            ...styles.neo4jSyncBtn,
            opacity: syncing ? 0.6 : 1,
            cursor: syncing ? 'not-allowed' : 'pointer'
          }}
        >
          {syncing ? '⏳ Syncing...' : '🔄 Sync MySQL → Neo4j'}
        </button>
      </div>

      {syncMessage && (
        <div style={{
          ...styles.neo4jSyncMsg,
          borderColor: syncMessage.includes('failed') ? 'rgba(211,47,47,0.5)' : 'rgba(76,175,80,0.5)',
          background: syncMessage.includes('failed') ? 'rgba(211,47,47,0.15)' : 'rgba(76,175,80,0.15)',
          color: syncMessage.includes('failed') ? '#ef9a9a' : '#a5d6a7'
        }}>
          {syncMessage}
        </div>
      )}

      {/* Graph summary cards */}
      {graphSummary && (
        <div style={styles.neo4jSummaryRow}>
          <div style={styles.neo4jSummaryCard}>
            <div style={styles.neo4jSummaryIcon}>👷</div>
            <div style={styles.neo4jSummaryVal}>{graphSummary.nodes?.workers ?? '—'}</div>
            <div style={styles.neo4jSummaryLab}>Workers</div>
          </div>
          <div style={styles.neo4jSummaryCard}>
            <div style={styles.neo4jSummaryIcon}>🚛</div>
            <div style={styles.neo4jSummaryVal}>{graphSummary.nodes?.vehicles ?? '—'}</div>
            <div style={styles.neo4jSummaryLab}>Vehicles</div>
          </div>
          <div style={{...styles.neo4jSummaryCard, background: 'rgba(0, 150, 136, 0.15)', borderColor: 'rgba(77, 208, 225, 0.4)'}}>
            <div style={styles.neo4jSummaryIcon}>🛣️</div>
            <div style={styles.neo4jSummaryVal}>{graphSummary.nodes?.routes ?? '—'}</div>
            <div style={styles.neo4jSummaryLab}>Routes</div>
          </div>
          <div style={styles.neo4jSummaryCard}>
            <div style={styles.neo4jSummaryIcon}>🗑️</div>
            <div style={styles.neo4jSummaryVal}>{graphSummary.nodes?.bins ?? '—'}</div>
            <div style={styles.neo4jSummaryLab}>Bins</div>
          </div>
          <div style={styles.neo4jSummaryCard}>
            <div style={styles.neo4jSummaryIcon}>🏙️</div>
            <div style={styles.neo4jSummaryVal}>{graphSummary.nodes?.zones ?? '—'}</div>
            <div style={styles.neo4jSummaryLab}>Zones</div>
          </div>
          <div style={{...styles.neo4jSummaryCard, background: 'rgba(156, 39, 176, 0.15)', borderColor: 'rgba(186, 104, 200, 0.4)'}}>
            <div style={styles.neo4jSummaryIcon}>🔗</div>
            <div style={styles.neo4jSummaryVal}>
              {(graphSummary.relationships?.assigned_to ?? 0) + (graphSummary.relationships?.follows ?? 0) + (graphSummary.relationships?.covers ?? 0) + (graphSummary.relationships?.has_bin ?? 0)}
            </div>
            <div style={styles.neo4jSummaryLab}>Relationships</div>
          </div>
        </div>
      )}
      {summaryLoading && <div style={styles.tableMessage}>Loading graph summary…</div>}

      {/* Query tabs */}
      <div style={styles.neo4jTabRow}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabSwitch(tab.key)}
            style={{
              ...styles.neo4jTab,
              ...(activeTab === tab.key ? styles.neo4jTabActive : {})
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Query input — hidden for worker tab since it auto-loads */}
      {activeTab !== 'worker' && (
        <div style={styles.neo4jQueryRow}>
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
            placeholder={currentTab?.placeholder || 'Enter ID...'}
            style={styles.neo4jQueryInput}
          />
          <button
            type="button"
            onClick={handleQuery}
            disabled={loading}
            style={styles.neo4jQueryBtn}
          >
            {loading ? '⏳' : '🔍'} Query Graph
          </button>
        </div>
      )}

      {/* Cypher hint */}
      <div style={styles.neo4jCypherHint}>
        <span style={{fontWeight: 600, color: 'rgba(255,255,255,0.7)'}}>Cypher: </span>
        <code style={styles.neo4jCypherCode}>
          {activeTab === 'worker' && 'MATCH (w:Worker)-[:ASSIGNED_TO]->(:Vehicle)-[:FOLLOWS]->(:Route)-[:COVERS]->(b:Bin) RETURN w.worker_id, w.worker_name, COUNT(b) AS total_bins ORDER BY total_bins DESC'}
          {activeTab === 'vehicle' && 'MATCH (v:Vehicle)-[:FOLLOWS]->(r:Route)-[:COVERS]->(b:Bin) WHERE v.vehicle_id = $id RETURN v,r,b'}
          {activeTab === 'zone' && 'MATCH (z:Zone)-[:HAS_BIN]->(b:Bin) WHERE z.zone_name = $name RETURN z,b'}
        </code>
      </div>

      {/* Worker Load Analysis — only for worker tab */}
      {activeTab === 'worker' && (
        <div>
          {workerLoadLoading && <div style={styles.tableMessage}>Analyzing worker load…</div>}
          {!workerLoadLoading && workerLoad.length === 0 && (
            <div style={styles.neo4jError}>No worker load data. Click "Sync MySQL → Neo4j" first.</div>
          )}
          {!workerLoadLoading && workerLoad.length > 0 && (
            <div style={styles.neo4jLoadGrid}>
              {workerLoad.map((w, i) => {
                const isOverloaded = w.total_bins > 5;
                return (
                  <div key={i} style={{
                    ...styles.neo4jLoadCard,
                    borderColor: isOverloaded ? 'rgba(211, 47, 47, 0.5)' : 'rgba(76, 175, 80, 0.4)',
                    background: isOverloaded
                      ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.12) 0%, rgba(183, 28, 28, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={styles.neo4jLoadTop}>
                      <div style={styles.neo4jLoadWorker}>
                        <span style={{fontSize: '20px'}}>👷</span>
                        <div>
                          <div style={styles.neo4jLoadName}>{w.worker_name || 'Unknown'}</div>
                          <div style={styles.neo4jLoadId}>ID: {w.worker_id}</div>
                        </div>
                      </div>
                      <span style={{
                        ...styles.neo4jLoadBadge,
                        background: isOverloaded ? 'rgba(211, 47, 47, 0.35)' : 'rgba(46, 125, 50, 0.35)',
                        color: isOverloaded ? '#ef9a9a' : '#a5d6a7',
                        borderColor: isOverloaded ? 'rgba(211, 47, 47, 0.6)' : 'rgba(46, 125, 50, 0.6)'
                      }}>
                        {isOverloaded ? '⚠️ Overloaded' : '✅ Normal'}
                      </span>
                    </div>
                    <div style={styles.neo4jLoadBar}>
                      <div style={styles.neo4jLoadBarLabel}>
                        <span>Bins Assigned</span>
                        <span style={{fontWeight: 700, fontSize: '18px', color: isOverloaded ? '#ef9a9a' : '#a5d6a7'}}>{w.total_bins}</span>
                      </div>
                      <div style={styles.neo4jLoadBarTrack}>
                        <div style={{
                          ...styles.neo4jLoadBarFill,
                          width: `${Math.min((w.total_bins / 10) * 100, 100)}%`,
                          background: isOverloaded
                            ? 'linear-gradient(90deg, #e53935, #ff7043)'
                            : 'linear-gradient(90deg, #43a047, #66bb6a)'
                        }} />
                        {/* Threshold marker at 5 */}
                        <div style={styles.neo4jLoadThreshold} />
                      </div>
                      <div style={{fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', textAlign: 'right'}}>Threshold: 5</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error for vehicle/zone tabs */}
      {activeTab !== 'worker' && error && !loading && (
        <div style={styles.neo4jError}>{error}</div>
      )}

      {/* Results for vehicle/zone tabs */}
      {activeTab !== 'worker' && loading && <div style={styles.tableMessage}>Querying Neo4j graph…</div>}
      {activeTab !== 'worker' && renderResults()}
    </section>
  );
}

// Dashboard Schedule Explorer — central decision-making panel (additive only)
function DashboardScheduleExplorer() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValues, setFilterValues] = useState({
    from_date: '',
    to_date: '',
    status: '',
    vehicle_id: '',
    bin_id: ''
  });

  const loadAllSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/schedules');
      if (!res.ok) throw new Error('Failed to load schedules');
      const data = await res.json();
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load schedules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSchedules();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilterValues({ from_date: '', to_date: '', status: '', vehicle_id: '', bin_id: '' });
    setActiveFilter(null);
    loadAllSchedules();
  };

  const applyFilters = async () => {
    setIsLoading(true);
    setError(null);
    setActiveFilter('Custom Filter');
    try {
      const params = new URLSearchParams();
      if (filterValues.from_date) params.append('from_date', filterValues.from_date);
      if (filterValues.to_date) params.append('to_date', filterValues.to_date);
      if (filterValues.status) params.append('status', filterValues.status);
      if (filterValues.vehicle_id) params.append('vehicle_id', filterValues.vehicle_id);
      if (filterValues.bin_id) params.append('bin_id', filterValues.bin_id);
      const res = await fetch(`http://localhost:5000/api/filter-schedules?${params.toString()}`);
      if (!res.ok) throw new Error('Filter failed');
      const data = await res.json();
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError('Filter request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFilter = async (endpoint, label) => {
    setIsLoading(true);
    setError(null);
    setActiveFilter(label);
    try {
      const res = await fetch(`http://localhost:5000/api/${endpoint}`);
      if (!res.ok) throw new Error(`Failed to fetch ${label}`);
      const data = await res.json();
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${label}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'active') return { backgroundColor: 'rgba(46, 125, 50, 0.2)', color: '#C8E6C9' };
    if (s === 'completed') return { backgroundColor: 'rgba(56, 142, 60, 0.25)', color: '#A5D6A7' };
    if (s === 'scheduled') return { backgroundColor: 'rgba(25, 118, 210, 0.2)', color: '#90CAF9' };
    return { backgroundColor: 'rgba(244, 81, 30, 0.15)', color: '#FFCCBC' };
  };

  return (
    <section style={styles.dashExplorerSection}>
      <h2 style={styles.dashExplorerTitle}>📋 Schedule Explorer</h2>
      <p style={styles.dashExplorerSubtitle}>
      </p>

      {/* Filter inputs */}
      <div style={styles.dashExplorerFilterCard}>
        <div style={styles.dashExplorerFilterRow}>
          <div style={styles.dashExplorerField}>
            <label style={styles.dashExplorerLabel}>From Date</label>
            <input
              type="date"
              name="from_date"
              value={filterValues.from_date}
              onChange={handleFilterChange}
              style={styles.dashExplorerInput}
            />
          </div>
          <div style={styles.dashExplorerField}>
            <label style={styles.dashExplorerLabel}>To Date</label>
            <input
              type="date"
              name="to_date"
              value={filterValues.to_date}
              onChange={handleFilterChange}
              style={styles.dashExplorerInput}
            />
          </div>
          <div style={styles.dashExplorerField}>
            <label style={styles.dashExplorerLabel}>Status</label>
            <select
              name="status"
              value={filterValues.status}
              onChange={handleFilterChange}
              style={styles.dashExplorerSelect}
            >
              <option value="">All</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div style={styles.dashExplorerField}>
            <label style={styles.dashExplorerLabel}>Vehicle ID</label>
            <input
              type="text"
              name="vehicle_id"
              value={filterValues.vehicle_id}
              onChange={handleFilterChange}
              style={styles.dashExplorerInput}
              placeholder="V001"
            />
          </div>
          <div style={styles.dashExplorerField}>
            <label style={styles.dashExplorerLabel}>Bin ID</label>
            <input
              type="text"
              name="bin_id"
              value={filterValues.bin_id}
              onChange={handleFilterChange}
              style={styles.dashExplorerInput}
              placeholder="B001"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={styles.dashExplorerBtnRow}>
          <button type="button" style={styles.dashExplorerSearchBtn} onClick={applyFilters}>
            🔍 Search Records
          </button>
          <button type="button" style={styles.dashExplorerResetBtn} onClick={resetFilters}>
            🔄 Reset
          </button>
          <button type="button" style={{
            ...styles.dashExplorerQuickBtn,
            ...(activeFilter === 'Today' ? styles.dashExplorerQuickBtnActive : {})
          }} onClick={() => quickFilter('today-schedules', 'Today')}>
            📅 Today
          </button>
          <button type="button" style={{
            ...styles.dashExplorerQuickBtn,
            background: 'rgba(255, 152, 0, 0.5)',
            borderColor: 'rgba(255, 152, 0, 0.7)',
            ...(activeFilter === 'Pending' ? styles.dashExplorerQuickBtnActive : {})
          }} onClick={() => quickFilter('overdue-schedules', 'Pending')}>
            ⏳ Pending
          </button>
          <button type="button" style={{
            ...styles.dashExplorerQuickBtn,
            background: 'rgba(46, 125, 50, 0.5)',
            borderColor: 'rgba(46, 125, 50, 0.7)',
            ...(activeFilter === 'Active' ? styles.dashExplorerQuickBtnActive : {})
          }} onClick={() => quickFilter('active-schedules', 'Active')}>
            ⚡ Active
          </button>
          <button type="button" style={{
            ...styles.dashExplorerQuickBtn,
            background: 'rgba(211, 47, 47, 0.5)',
            borderColor: 'rgba(211, 47, 47, 0.7)',
            ...(activeFilter === 'Full Bin Records' ? styles.dashExplorerQuickBtnActive : {})
          }} onClick={() => quickFilter('full-bin-schedules', 'Full Bin Records')}>
            🗑️ Full Bin Records
          </button>
        </div>

        {activeFilter && (
          <div style={styles.dashExplorerActiveTag}>
            Showing: <strong>{activeFilter}</strong> &nbsp;·&nbsp; {schedules.length} record{schedules.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Results table */}
      {isLoading && <div style={styles.tableMessage}>Loading schedules…</div>}
      {error && !isLoading && (
        <div style={{ ...styles.tableMessage, color: '#ffebee', backgroundColor: 'rgba(211, 47, 47, 0.35)' }}>
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Schedule ID</th>
                <th style={styles.tableHeaderCell}>Bin ID</th>
                <th style={styles.tableHeaderCell}>Vehicle ID</th>
                <th style={styles.tableHeaderCell}>Schedule Time</th>
                <th style={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 ? (
                schedules.map((s) => (
                  <tr key={s.schedule_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{s.schedule_id}</td>
                    <td style={styles.tableCell}>{s.bin_id}</td>
                    <td style={styles.tableCell}>{s.vehicle_id}</td>
                    <td style={styles.tableCell}>{s.schedule_time}</td>
                    <td style={styles.tableCell}>
                      <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(s.schedule_status) }}>
                        {s.schedule_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="5">
                    No schedules match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// City Zone Management page (CITY_ZONE table)
function CityZonePage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [formValues, setFormValues] = useState({
    zone_id: '',
    zone_name: '',
    manager_name: '',
    zone_status: 'Active'
  });

  const loadZonesFromDb = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/zones');
      if (!res.ok) throw new Error('Failed to load city zones');
      const data = await res.json();
      setZones(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load city zones. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadZonesFromDb();
  }, []);

  const resetForm = () => {
    setFormMode('create');
    setEditingZoneId(null);
    setFormValues({
      zone_id: '',
      zone_name: '',
      manager_name: '',
      zone_status: 'Active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = (zone) => {
    setFormMode('edit');
    setEditingZoneId(zone.zone_id);
    setFormValues({
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      manager_name: zone.manager_name,
      zone_status: String(zone.zone_status || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
    });
  };

  const handleDeleteClick = async (zoneId) => {
    const confirmed = window.confirm(`Are you sure you want to delete City Zone ${zoneId}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/zones/${encodeURIComponent(zoneId)}`, {
        method: 'DELETE'
      });
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete zone');
      }
      await loadZonesFromDb();
      if (editingZoneId === zoneId) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      window.alert('Failed to delete zone. Check backend/DB console for details.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formValues.zone_id || !formValues.zone_name || !formValues.manager_name) {
      window.alert('Please fill all fields before submitting.');
      return;
    }

    const payload = {
      zone_id: formValues.zone_id,
      zone_name: formValues.zone_name,
      manager_name: formValues.manager_name,
      zone_status: formValues.zone_status
    };

    try {
      if (formMode === 'create') {
        const res = await fetch('http://localhost:5000/api/zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          throw new Error('Failed to insert city zone');
        }
      } else if (formMode === 'edit' && editingZoneId != null) {
        const res = await fetch(
          `http://localhost:5000/api/zones/${encodeURIComponent(editingZoneId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zone_name: formValues.zone_name,
              manager_name: formValues.manager_name,
              zone_status: formValues.zone_status
            })
          }
        );
        if (!res.ok) {
          throw new Error('Failed to update city zone');
        }
      }

      await loadZonesFromDb();
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to save city zone. Check backend/DB console for details.');
    }
  };

  return (
    <div style={styles.dataPageCard}>
      <div style={styles.dataPageHeader}>
        <div>
          <h1 style={styles.dataPageTitle}>City Zone Management</h1>
        </div>
        <button
          style={styles.backButton}
          onClick={() => navigate('/municipal')}
        >
          Back to Dashboard
        </button>
      </div>

      {/* CRUD Operations Panel */}
      <div style={styles.crudCard}>
        <div style={styles.crudHeaderRow}>
          <h2 style={styles.crudTitle}>
            {formMode === 'create' ? 'Add City Zone' : 'Update City Zone'}
          </h2>
          {formMode === 'edit' && (
            <button type="button" style={styles.crudResetButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form style={styles.crudFormRow} onSubmit={handleFormSubmit}>
          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Zone ID</label>
            <input
              type="text"
              name="zone_id"
              value={formValues.zone_id}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Z001"
              disabled={formMode === 'edit'}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Zone Name</label>
            <input
              type="text"
              name="zone_name"
              value={formValues.zone_name}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Central Business District"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Manager Name</label>
            <input
              type="text"
              name="manager_name"
              value={formValues.manager_name}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Zone Supervisor"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="zone_status"
              value={formValues.zone_status}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={styles.crudActionsGroup}>
            <button
              type="submit"
              style={
                formMode === 'create'
                  ? styles.crudPrimaryButton
                  : styles.crudUpdateButton
              }
            >
              {formMode === 'create' ? 'Add Zone' : 'Update Zone'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div style={styles.tableMessage}>Loading city zones...</div>}
      {error && !isLoading && (
        <div
          style={{
            ...styles.tableMessage,
            color: '#ffebee',
            backgroundColor: 'rgba(211, 47, 47, 0.35)'
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Zone ID</th>
                <th style={styles.tableHeaderCell}>Zone Name</th>
                <th style={styles.tableHeaderCell}>Manager Name</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <tr key={zone.zone_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{zone.zone_id}</td>
                    <td style={styles.tableCell}>{zone.zone_name}</td>
                    <td style={styles.tableCell}>{zone.manager_name}</td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            String(zone.zone_status).toLowerCase() === 'active'
                              ? 'rgba(46, 125, 50, 0.15)'
                              : 'rgba(244, 81, 30, 0.15)',
                          color:
                            String(zone.zone_status).toLowerCase() === 'active'
                              ? '#C8E6C9'
                              : '#FFCCBC'
                        }}
                      >
                        {zone.zone_status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button
                        type="button"
                        style={styles.tableEditButton}
                        onClick={() => handleEditClick(zone)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.tableDeleteButton}
                        onClick={() => handleDeleteClick(zone.zone_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="5">
                    No city zones found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Waste Bin Management page (WASTE_BIN table)
function WasteBinPage() {
  const navigate = useNavigate();
  const [bins, setBins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingBinId, setEditingBinId] = useState(null);
  const [formValues, setFormValues] = useState({
    bin_id: '',
    zone_id: '',
    location: '',
    capacity: '',
    waste_type: '',
    bin_status: 'Active'
  });

  const loadBinsFromDb = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/bins');
      if (!res.ok) throw new Error('Failed to load waste bins');
      const data = await res.json();
      setBins(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load waste bins. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadBinsFromDb();
      // load valid zones for FK dropdown
      try {
        const res = await fetch('http://localhost:5000/api/zones');
        if (!res.ok) throw new Error('Failed to load zones');
        const data = await res.json();
        setZoneOptions(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setFormMode('create');
    setEditingBinId(null);
    setFormValues({
      bin_id: '',
      zone_id: '',
      location: '',
      capacity: '',
      waste_type: '',
      bin_status: 'Active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (bin) => {
    setFormMode('edit');
    setEditingBinId(bin.bin_id);
    setFormValues({
      bin_id: bin.bin_id,
      zone_id: bin.zone_id,
      location: bin.location,
      capacity: bin.capacity,
      waste_type: bin.waste_type,
      bin_status: String(bin.bin_status || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
    });
  };

  const handleDeleteClick = async (binId) => {
    const confirmed = window.confirm(`Are you sure you want to delete Waste Bin ${binId}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bins/${encodeURIComponent(binId)}`, {
        method: 'DELETE'
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete bin');
      await loadBinsFromDb();
      if (editingBinId === binId) resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to delete bin. Check backend/DB console for details.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      bin_id: formValues.bin_id,
      zone_id: formValues.zone_id,
      location: formValues.location,
      capacity: formValues.capacity,
      waste_type: formValues.waste_type,
      bin_status: formValues.bin_status
    };

    try {
      let res;
      if (formMode === 'create') {
        res = await fetch('http://localhost:5000/api/bins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.code === 'PK_BIN_DUP') {
            window.alert('Bin ID already exists. Please use a unique Bin ID.');
          } else if (errData && errData.code === 'FK_ZONE_INVALID') {
            window.alert('Invalid Zone selected. Please choose an existing City Zone.');
          } else if (errData && errData.error) {
            window.alert(errData.error);
          } else {
            window.alert('Failed to insert bin. Check backend/DB console for details.');
          }
          return;
        }
      } else if (formMode === 'edit' && editingBinId != null) {
        res = await fetch(
          `http://localhost:5000/api/bins/${encodeURIComponent(editingBinId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zone_id: formValues.zone_id,
              location: formValues.location,
              capacity: formValues.capacity,
              waste_type: formValues.waste_type,
              bin_status: formValues.bin_status
            })
          }
        );
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.code === 'FK_ZONE_INVALID') {
            window.alert('Invalid Zone selected. Please choose an existing City Zone.');
          } else if (errData && errData.error) {
            window.alert(errData.error);
          } else {
            window.alert('Failed to update bin. Check backend/DB console for details.');
          }
          return;
        }
      }

      await loadBinsFromDb();
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to save bin. Check backend/DB console for details.');
    }
  };

  return (
    <div style={styles.dataPageCard}>
      <div style={styles.dataPageHeader}>
        <div>
          <h1 style={styles.dataPageTitle}>Waste Bin Management</h1>
        </div>
        <button style={styles.backButton} onClick={() => navigate('/municipal')}>
          Back to Dashboard
        </button>
      </div>

      <div style={styles.crudCard}>
        <div style={styles.crudHeaderRow}>
          <h2 style={styles.crudTitle}>
            {formMode === 'create' ? 'Add Waste Bin' : 'Update Waste Bin'}
          </h2>
          {formMode === 'edit' && (
            <button type="button" style={styles.crudResetButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form style={styles.crudFormRow} onSubmit={handleFormSubmit}>
          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Bin ID</label>
            <input
              type="text"
              name="bin_id"
              value={formValues.bin_id}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="B001"
              disabled={formMode === 'edit'}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Zone </label>
            <select
              name="zone_id"
              value={formValues.zone_id}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="">Select City Zone</option>
              {zoneOptions.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  {z.zone_id} – {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formValues.location}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Street / Landmark"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formValues.capacity}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="100"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Waste Type</label>
            <input
              type="text"
              name="waste_type"
              value={formValues.waste_type}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Dry / Wet / Mixed"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="bin_status"
              value={formValues.bin_status}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="Available">Available</option>
              <option value="Full">Full</option>
            </select>
          </div>

          <div style={styles.crudActionsGroup}>
            <button
              type="submit"
              style={formMode === 'create' ? styles.crudPrimaryButton : styles.crudUpdateButton}
            >
              {formMode === 'create' ? 'Add Bin' : 'Update Bin'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div style={styles.tableMessage}>Loading waste bins...</div>}
      {error && !isLoading && (
        <div
          style={{
            ...styles.tableMessage,
            color: '#ffebee',
            backgroundColor: 'rgba(211, 47, 47, 0.35)'
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Bin ID</th>
                <th style={styles.tableHeaderCell}>Zone ID</th>
                <th style={styles.tableHeaderCell}>Location</th>
                <th style={styles.tableHeaderCell}>Capacity</th>
                <th style={styles.tableHeaderCell}>Waste Type</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bins.length > 0 ? (
                bins.map((bin) => (
                  <tr key={bin.bin_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{bin.bin_id}</td>
                    <td style={styles.tableCell}>{bin.zone_id}</td>
                    <td style={styles.tableCell}>{bin.location}</td>
                    <td style={styles.tableCell}>{bin.capacity}</td>
                    <td style={styles.tableCell}>{bin.waste_type}</td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            String(bin.bin_status).toLowerCase() === 'active'
                              ? 'rgba(46, 125, 50, 0.15)'
                              : 'rgba(244, 81, 30, 0.15)',
                          color:
                            String(bin.bin_status).toLowerCase() === 'active'
                              ? '#C8E6C9'
                              : '#FFCCBC'
                        }}
                      >
                        {bin.bin_status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button type="button" style={styles.tableEditButton} onClick={() => handleEditClick(bin)}>
                        Edit
                      </button>
                      <button type="button" style={styles.tableDeleteButton} onClick={() => handleDeleteClick(bin.bin_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="7">
                    No waste bins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Collection Vehicle Management page (COLLECTION_VEHICLE table)
function CollectionVehiclePage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [formValues, setFormValues] = useState({
    vehicle_id: '',
    vehicle_number: '',
    capacity: '',
    vehicle_status: 'Active'
  });

  const loadVehiclesFromDb = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/vehicles');
      if (!res.ok) throw new Error('Failed to load vehicles');
      const data = await res.json();
      setVehicles(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load vehicles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVehiclesFromDb();
  }, []);

  const resetForm = () => {
    setFormMode('create');
    setEditingVehicleId(null);
    setFormValues({
      vehicle_id: '',
      vehicle_number: '',
      capacity: '',
      vehicle_status: 'Active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (v) => {
    setFormMode('edit');
    setEditingVehicleId(v.vehicle_id);
    setFormValues({
      vehicle_id: v.vehicle_id,
      vehicle_number: v.vehicle_number,
      capacity: v.capacity,
      vehicle_status: v.vehicle_status || 'Active'
    });
  };

  const handleDeleteClick = async (vehicleId) => {
    const confirmed = window.confirm(`Are you sure you want to delete Vehicle ${vehicleId}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${encodeURIComponent(vehicleId)}`, {
        method: 'DELETE'
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete vehicle');
      await loadVehiclesFromDb();
      if (editingVehicleId === vehicleId) resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to delete vehicle. Check backend/DB console for details.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      vehicle_id: formValues.vehicle_id,
      vehicle_number: formValues.vehicle_number,
      capacity: formValues.capacity,
      vehicle_status: formValues.vehicle_status
    };

    try {
      if (formMode === 'create') {
        const res = await fetch('http://localhost:5000/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to insert vehicle');
      } else if (formMode === 'edit' && editingVehicleId != null) {
        const res = await fetch(
          `http://localhost:5000/api/vehicles/${encodeURIComponent(editingVehicleId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicle_number: formValues.vehicle_number,
              capacity: formValues.capacity,
              vehicle_status: formValues.vehicle_status
            })
          }
        );
        if (!res.ok) throw new Error('Failed to update vehicle');
      }

      await loadVehiclesFromDb();
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to save vehicle. Check backend/DB console for details.');
    }
  };

  return (
    <div style={styles.dataPageCard}>
      <div style={styles.dataPageHeader}>
        <div>
          <h1 style={styles.dataPageTitle}>Collection Vehicle Management</h1>
        </div>
        <button style={styles.backButton} onClick={() => navigate('/municipal')}>
          Back to Dashboard
        </button>
      </div>

      <div style={styles.crudCard}>
        <div style={styles.crudHeaderRow}>
          <h2 style={styles.crudTitle}>
            {formMode === 'create' ? 'Add Vehicle' : 'Update Vehicle'}
          </h2>
          {formMode === 'edit' && (
            <button type="button" style={styles.crudResetButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form style={styles.crudFormRow} onSubmit={handleFormSubmit}>
          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Vehicle ID</label>
            <input
              type="text"
              name="vehicle_id"
              value={formValues.vehicle_id}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="V001"
              disabled={formMode === 'edit'}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Vehicle Number</label>
            <input
              type="text"
              name="vehicle_number"
              value={formValues.vehicle_number}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="MH-01-AB-1234"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formValues.capacity}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="1000"
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="vehicle_status"
              value={formValues.vehicle_status}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div style={styles.crudActionsGroup}>
            <button
              type="submit"
              style={formMode === 'create' ? styles.crudPrimaryButton : styles.crudUpdateButton}
            >
              {formMode === 'create' ? 'Add Vehicle' : 'Update Vehicle '}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div style={styles.tableMessage}>Loading vehicles...</div>}
      {error && !isLoading && (
        <div
          style={{
            ...styles.tableMessage,
            color: '#ffebee',
            backgroundColor: 'rgba(211, 47, 47, 0.35)'
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Vehicle ID</th>
                <th style={styles.tableHeaderCell}>Vehicle Number</th>
                <th style={styles.tableHeaderCell}>Capacity</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? (
                vehicles.map((v) => (
                  <tr key={v.vehicle_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{v.vehicle_id}</td>
                    <td style={styles.tableCell}>{v.vehicle_number}</td>
                    <td style={styles.tableCell}>{v.capacity}</td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            String(v.vehicle_status).toLowerCase() === 'active' ||
                            String(v.vehicle_status).toLowerCase() === 'available'
                              ? 'rgba(46, 125, 50, 0.15)'
                              : 'rgba(244, 81, 30, 0.15)',
                          color:
                            String(v.vehicle_status).toLowerCase() === 'active' ||
                            String(v.vehicle_status).toLowerCase() === 'available'
                              ? '#C8E6C9'
                              : '#FFCCBC'
                        }}
                      >
                        {v.vehicle_status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button type="button" style={styles.tableEditButton} onClick={() => handleEditClick(v)}>
                        Edit
                      </button>
                      <button type="button" style={styles.tableDeleteButton} onClick={() => handleDeleteClick(v.vehicle_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="5">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Vehicle Assignment Management page (VEHICLE_ASSIGNMENT table)
function VehicleAssignmentPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [formValues, setFormValues] = useState({
    assignment_id: '',
    vehicle_id: '',
    worker_id: '',
    assigned_from: '',
    assigned_to: ''
  });
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [workerOptions, setWorkerOptions] = useState([]);

  const loadAssignmentsFromDb = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/assignments');
      if (!res.ok) throw new Error('Failed to load assignments');
      const data = await res.json();
      setAssignments(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load assignments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadAssignmentsFromDb();
      try {
        const [vRes, wRes] = await Promise.all([
          fetch('http://localhost:5000/api/vehicles'),
          fetch('http://localhost:5000/api/workers')
        ]);
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicleOptions(vData || []);
        }
        if (wRes.ok) {
          const wData = await wRes.json();
          setWorkerOptions(wData || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setFormMode('create');
    setEditingAssignmentId(null);
    setFormValues({
      assignment_id: '',
      vehicle_id: '',
      worker_id: '',
      assigned_from: '',
      assigned_to: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (a) => {
    setFormMode('edit');
    setEditingAssignmentId(a.assignment_id);
    setFormValues({
      assignment_id: a.assignment_id,
      vehicle_id: a.vehicle_id,
      worker_id: a.worker_id,
      assigned_from: a.assigned_from,
      assigned_to: a.assigned_to
    });
  };

  const handleDeleteClick = async (assignmentId) => {
    const confirmed = window.confirm(`Are you sure you want to delete Assignment ${assignmentId}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/assignments/${encodeURIComponent(assignmentId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete assignment');
      await loadAssignmentsFromDb();
      if (editingAssignmentId === assignmentId) resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to delete assignment. Check backend/DB console for details.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      assignment_id: formValues.assignment_id,
      vehicle_id: formValues.vehicle_id,
      worker_id: formValues.worker_id,
      assigned_from: formValues.assigned_from,
      assigned_to: formValues.assigned_to
    };

    try {
      let res;
      if (formMode === 'create') {
        res = await fetch('http://localhost:5000/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.code === 'FK_ASSIGNMENT_INVALID') {
            window.alert('Invalid Vehicle or Worker selected. Please choose an existing record.');
          } else {
            window.alert('Failed to insert assignment. Check backend/DB console for details.');
          }
          return;
        }
      } else if (formMode === 'edit' && editingAssignmentId != null) {
        res = await fetch(
          `http://localhost:5000/api/assignments/${encodeURIComponent(editingAssignmentId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicle_id: formValues.vehicle_id,
              worker_id: formValues.worker_id,
              assigned_from: formValues.assigned_from,
              assigned_to: formValues.assigned_to
            })
          }
        );
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.code === 'FK_ASSIGNMENT_INVALID') {
            window.alert('Invalid Vehicle or Worker selected. Please choose an existing record.');
          } else {
            window.alert('Failed to update assignment. Check backend/DB console for details.');
          }
          return;
        }
      }

      await loadAssignmentsFromDb();
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to save assignment. Check backend/DB console for details.');
    }
  };

  return (
    <div style={styles.dataPageCard}>
      <div style={styles.dataPageHeader}>
        <div>
          <h1 style={styles.dataPageTitle}>Vehicle–Worker Assignment Management</h1>
        </div>
        <button style={styles.backButton} onClick={() => navigate('/municipal')}>
          Back to Dashboard
        </button>
      </div>

      <div style={styles.crudCard}>
        <div style={styles.crudHeaderRow}>
          <h2 style={styles.crudTitle}>
            {formMode === 'create' ? 'Add Assignment' : 'Update Assignment'}
          </h2>
          {formMode === 'edit' && (
            <button type="button" style={styles.crudResetButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form style={styles.crudFormRow} onSubmit={handleFormSubmit}>
          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Assignment ID</label>
            <input
              type="text"
              name="assignment_id"
              value={formValues.assignment_id}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="A001"
              disabled={formMode === 'edit'}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Vehicle</label>
            <select
              name="vehicle_id"
              value={formValues.vehicle_id}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="">Select Vehicle</option>
              {vehicleOptions.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} – {v.vehicle_number}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Worker</label>
            <select
              name="worker_id"
              value={formValues.worker_id}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="">Select Worker</option>
              {workerOptions.map((w) => (
                <option key={w.worker_id} value={w.worker_id}>
                  {w.worker_id} – {w.worker_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Assigned From</label>
            <input
              type="datetime-local"
              name="assigned_from"
              value={formValues.assigned_from}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Assigned To</label>
            <input
              type="datetime-local"
              name="assigned_to"
              value={formValues.assigned_to}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.crudActionsGroup}>
            <button
              type="submit"
              style={formMode === 'create' ? styles.crudPrimaryButton : styles.crudUpdateButton}
            >
              {formMode === 'create' ? 'Add Assignment' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div style={styles.tableMessage}>Loading assignments...</div>}
      {error && !isLoading && (
        <div
          style={{
            ...styles.tableMessage,
            color: '#ffebee',
            backgroundColor: 'rgba(211, 47, 47, 0.35)'
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Assignment ID</th>
                <th style={styles.tableHeaderCell}>Vehicle ID</th>
                <th style={styles.tableHeaderCell}>Worker ID</th>
                <th style={styles.tableHeaderCell}>Assigned From</th>
                <th style={styles.tableHeaderCell}>Assigned To</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
                assignments.map((a) => (
                  <tr key={a.assignment_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{a.assignment_id}</td>
                    <td style={styles.tableCell}>{a.vehicle_id}</td>
                    <td style={styles.tableCell}>{a.worker_id}</td>
                    <td style={styles.tableCell}>{a.assigned_from}</td>
                    <td style={styles.tableCell}>{a.assigned_to}</td>
                    <td style={styles.tableCell}>
                      <button type="button" style={styles.tableEditButton} onClick={() => handleEditClick(a)}>
                        Edit
                      </button>
                      <button type="button" style={styles.tableDeleteButton} onClick={() => handleDeleteClick(a.assignment_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="6">
                    No vehicle assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Collection Schedule Management page (COLLECTION_SCHEDULE table)
function CollectionSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [formValues, setFormValues] = useState({
    schedule_id: '',
    bin_id: '',
    vehicle_id: '',
    schedule_time: '',
    schedule_status: 'Active'
  });
  const [binOptions, setBinOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);

  const loadSchedulesFromDb = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/schedules');
      if (!res.ok) throw new Error('Failed to load schedules');
      const data = await res.json();
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load schedules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadSchedulesFromDb();
      try {
        const [bRes, vRes] = await Promise.all([
          fetch('http://localhost:5000/api/bins'),
          fetch('http://localhost:5000/api/vehicles')
        ]);
        if (bRes.ok) {
          const bData = await bRes.json();
          setBinOptions(bData || []);
        }
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicleOptions(vData || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setFormMode('create');
    setEditingScheduleId(null);
    setFormValues({
      schedule_id: '',
      bin_id: '',
      vehicle_id: '',
      schedule_time: '',
      schedule_status: 'Active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (s) => {
    setFormMode('edit');
    setEditingScheduleId(s.schedule_id);
    setFormValues({
      schedule_id: s.schedule_id,
      bin_id: s.bin_id,
      vehicle_id: s.vehicle_id,
      // if DB returns "YYYY-MM-DD HH:mm:ss", best-effort convert for datetime-local
      schedule_time: String(s.schedule_time || '').replace(' ', 'T').slice(0, 16),
      schedule_status: s.schedule_status || 'Scheduled'
    });
  };

  const handleDeleteClick = async (scheduleId) => {
    const confirmed = window.confirm(`Are you sure you want to delete Schedule ${scheduleId}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/${encodeURIComponent(scheduleId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete schedule');
      await loadSchedulesFromDb();
      if (editingScheduleId === scheduleId) resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to delete schedule. Check backend/DB console for details.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      schedule_id: formValues.schedule_id,
      bin_id: formValues.bin_id,
      vehicle_id: formValues.vehicle_id,
      schedule_time: formValues.schedule_time ? formValues.schedule_time.replace('T', ' ') : '',
      schedule_status: formValues.schedule_status
    };

    try {
      let res;
      if (formMode === 'create') {
        res = await fetch('http://localhost:5000/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.error) {
            window.alert(errData.error);
          } else if (errData && errData.code === 'FK_SCHEDULE_INVALID') {
            window.alert('Invalid Bin or Vehicle selected. Please choose existing records.');
          } else {
            window.alert('Failed to insert schedule. Check backend/DB console for details.');
          }
          return;
        }
      } else if (formMode === 'edit' && editingScheduleId != null) {
        res = await fetch(
          `http://localhost:5000/api/schedules/${encodeURIComponent(editingScheduleId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bin_id: formValues.bin_id,
              vehicle_id: formValues.vehicle_id,
              schedule_time: payload.schedule_time,
              schedule_status: formValues.schedule_status
            })
          }
        );
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch (_) {}
          if (errData && errData.error) {
            window.alert(errData.error);
          } else if (errData && errData.code === 'FK_SCHEDULE_INVALID') {
            window.alert('Invalid Bin or Vehicle selected. Please choose existing records.');
          } else {
            window.alert('Failed to update schedule. Check backend/DB console for details.');
          }
          return;
        }
      }

      await loadSchedulesFromDb();
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert('Failed to save schedule. Check backend/DB console for details.');
    }
  };

  return (
    <div style={styles.dataPageCard}>
      <div style={styles.dataPageHeader}>
        <div>
          <h1 style={styles.dataPageTitle}>Collection Schedule Management</h1>
        </div>
        <button style={styles.backButton} onClick={() => navigate('/municipal')}>
          Back to Dashboard
        </button>
      </div>

      <div style={styles.crudCard}>
        <div style={styles.crudHeaderRow}>
          <h2 style={styles.crudTitle}>
            {formMode === 'create' ? 'Add Schedule' : 'Update Schedule'}
          </h2>
          {formMode === 'edit' && (
            <button type="button" style={styles.crudResetButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form style={styles.crudFormRow} onSubmit={handleFormSubmit}>
          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Schedule ID</label>
            <input
              type="text"
              name="schedule_id"
              value={formValues.schedule_id}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="S001"
              disabled={formMode === 'edit'}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Bin</label>
            <select
              name="bin_id"
              value={formValues.bin_id}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="">Select Bin</option>
              {binOptions.map((b) => (
                <option key={b.bin_id} value={b.bin_id}>
                  {b.bin_id} – {b.location}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Vehicle</label>
            <select
              name="vehicle_id"
              value={formValues.vehicle_id}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="">Select Vehicle</option>
              {vehicleOptions.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} – {v.vehicle_number}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Schedule Time</label>
            <input
              type="datetime-local"
              name="schedule_time"
              value={formValues.schedule_time}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.crudFieldGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="schedule_status"
              value={formValues.schedule_status}
              onChange={handleInputChange}
              style={styles.select}
              required
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={styles.crudActionsGroup}>
            <button
              type="submit"
              style={formMode === 'create' ? styles.crudPrimaryButton : styles.crudUpdateButton}
            >
              {formMode === 'create' ? 'Add Schedule ' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div style={styles.tableMessage}>Loading schedules...</div>}
      {error && !isLoading && (
        <div
          style={{
            ...styles.tableMessage,
            color: '#ffebee',
            backgroundColor: 'rgba(211, 47, 47, 0.35)'
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable} className="dataTable">
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Schedule ID</th>
                <th style={styles.tableHeaderCell}>Bin ID</th>
                <th style={styles.tableHeaderCell}>Vehicle ID</th>
                <th style={styles.tableHeaderCell}>Schedule Time</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 ? (
                schedules.map((s) => (
                  <tr key={s.schedule_id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{s.schedule_id}</td>
                    <td style={styles.tableCell}>{s.bin_id}</td>
                    <td style={styles.tableCell}>{s.vehicle_id}</td>
                    <td style={styles.tableCell}>{s.schedule_time}</td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            String(s.schedule_status).toLowerCase() === 'active'
                              ? 'rgba(46, 125, 50, 0.15)'
                              : 'rgba(244, 81, 30, 0.15)',
                          color:
                            String(s.schedule_status).toLowerCase() === 'active'
                              ? '#C8E6C9'
                              : '#FFCCBC'
                        }}
                      >
                        {s.schedule_status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button type="button" style={styles.tableEditButton} onClick={() => handleEditClick(s)}>
                        Edit
                      </button>
                      <button type="button" style={styles.tableDeleteButton} onClick={() => handleDeleteClick(s.schedule_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.emptyTableCell} colSpan="6">
                    No collection schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 25%, #1976D2 50%, #1565C0 75%, #0D47A1 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },
  welcomeCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '60px 48px',
    maxWidth: '1200px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  mainTitle: {
    fontSize: 'clamp(28px, 5vw, 42px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px',
    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.5px'
  },
  subtitle: {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '48px',
    fontWeight: '300'
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
    width: '100%'
  },
  citizenSection: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px 32px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
    letterSpacing: '0.3px'
  },
  sectionNote: {
    fontSize: 'clamp(12px, 1.5vw, 14px)',
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: '24px',
    fontWeight: '300',
    fontStyle: 'italic'
  },
  citizenButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  citizenButton: {
    background: 'rgba(74, 144, 226, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: 'clamp(14px, 2vw, 16px)',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
    letterSpacing: '0.5px',
    width: '100%'
  },
  roleCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px 32px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  roleIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    color: '#ffffff'
  },
  roleTitle: {
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
    letterSpacing: '0.3px'
  },
  roleDescription: {
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '300',
    lineHeight: '1.6',
    marginBottom: '4px'
  },
  roleSubtext: {
    fontSize: 'clamp(12px, 1.5vw, 14px)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
    fontStyle: 'italic'
  },
  authCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  authTitle: {
    fontSize: 'clamp(26px, 4vw, 32px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px',
    textAlign: 'center',
    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.5px'
  },
  authSubtitle: {
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '32px',
    textAlign: 'center',
    fontWeight: '300'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'left'
  },
  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  select: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none',
    cursor: 'pointer'
  },
  textarea: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical'
  },
  submitButton: {
    background: 'rgba(46, 125, 50, 0.8)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
    letterSpacing: '0.5px',
    marginTop: '8px'
  },
  backButton: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.5px',
    marginTop: '8px'
  },
  dashboardCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '700px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  dashboardTitle: {
    fontSize: 'clamp(28px, 4vw, 36px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.5px'
  },
  welcomeMessage: {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: '32px',
    fontWeight: '400'
  },
  primaryButton: {
    background: 'rgba(46, 125, 50, 0.8)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '16px 40px',
    fontSize: 'clamp(16px, 2vw, 18px)',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
    letterSpacing: '0.5px',
    marginBottom: '16px',
    width: '100%',
    maxWidth: '300px'
  },
  logoutButton: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.5px',
    width: '100%',
    maxWidth: '300px'
  },
  complaintFormContainer: {
    textAlign: 'left',
    width: '100%'
  },
  formTitle: {
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px',
    textAlign: 'center',
    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.5px'
  },
  infoText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: '24px',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '300'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '8px',
    flexWrap: 'wrap'
  },
  cancelButton: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.5px'
  },
  officerDashboardCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '1000px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  officerDashboardTitle: {
    fontSize: 'clamp(28px, 4vw, 36px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.5px'
  },
  officerWelcomeMessage: {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: '40px',
    fontWeight: '400'
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
    width: '100%'
  },
  sectionButton: {
    background: 'rgba(80, 200, 120, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '20px 24px',
    fontSize: 'clamp(14px, 2vw, 16px)',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(80, 200, 120, 0.3)',
    letterSpacing: '0.5px',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  sectionInfo: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  sectionInfoText: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '400',
    lineHeight: '1.6',
    margin: 0
  },
  officerLogoutButton: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.5px',
    width: '100%',
    maxWidth: '200px'
  },
  officerShell: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%'
  },
  sidebar: {
    width: '260px',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  sidebarLogoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#4CAF50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '16px'
  },
  sidebarTitle: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '15px'
  },
  sidebarSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '11px'
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '8px'
  },
  sidebarNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.85)',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    transition: 'background 0.2s ease, color 0.2s ease'
  },
  sidebarNavItemActive: {
    background: 'rgba(76, 175, 80, 0.2)',
    color: '#ffffff'
  },
  sidebarNavIcon: {
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px'
  },
  officerMain: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 25%, #1976D2 50%, #1565C0 75%, #0D47A1 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
    minHeight: '100vh'
  },
  dashboardPage: {
    maxWidth: '1100px',
    width: '100%'
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  summaryCard: {
    background: 'rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '18px 16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    cursor: 'pointer'
  },
  summaryValue: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#ffffff'
  },
  summaryLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 600
  },
  summaryDescription: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  dbmsNoteBox: {
    marginTop: '8px',
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px dashed rgba(255, 255, 255, 0.25)'
  },
  dbmsNoteTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '6px'
  },
  dbmsNoteText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 1.5
  },
  dbmsInlineNote: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px dashed rgba(255, 255, 255, 0.25)',
    marginBottom: '12px'
  },
  dbmsInfoBox: {
    background: 'rgba(0, 0, 0, 0.35)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  dbmsInfoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dbmsInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  dbmsInfoItem: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.15)'
  },
  dbmsInfoDescription: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: '1.6',
    margin: 0,
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px'
  },
  tableCard: {
    marginTop: '16px',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    textAlign: 'left'
  },
  tableTitle: {
    fontSize: 'clamp(18px, 2.5vw, 22px)',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px'
  },
  tableSubtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '16px'
  },
  dataPageCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '1400px',
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
  },
  dataPageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  dataPageTitle: {
    fontSize: 'clamp(24px, 3vw, 32px)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  },
  dataPageSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400'
  },
  tableWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    background: 'rgba(3, 19, 31, 0.85)',
    overflowX: 'auto'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeaderCell: {
    padding: '12px 16px',
    textAlign: 'left',
    background: 'rgba(21, 101, 192, 0.9)',
    color: '#E3F2FD',
    fontWeight: '600',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(6px)'
  },
  tableRow: {
    background: 'rgba(13, 71, 161, 0.4)',
    transition: 'all 0.2s ease'
  },
  tableCell: {
    padding: '10px 16px',
    color: '#E3F2FD',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  emptyTableCell: {
    padding: '16px',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center'
  },
  tableMessage: {
    marginBottom: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(21, 101, 192, 0.5)',
    color: '#E3F2FD',
    fontSize: '13px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.4px'
  },
  crudCard: {
    marginBottom: '20px',
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)'
  },
  crudHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap'
  },
  crudTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff'
  },
  crudResetButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '12px',
    color: '#ffffff',
    cursor: 'pointer'
  },
  crudFormRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    alignItems: 'flex-end'
  },
  crudFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  crudActionsGroup: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '10px'
  },
  crudPrimaryButton: {
    background: 'rgba(46, 125, 50, 0.85)',
    border: '2px solid rgba(46, 125, 50, 1)',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(46, 125, 50, 0.4)'
  },
  crudUpdateButton: {
    background: 'rgba(25, 118, 210, 0.9)',
    border: '2px solid rgba(25, 118, 210, 1)',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.4)'
  },
  tableEditButton: {
    background: 'rgba(25, 118, 210, 0.9)',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    marginRight: '6px'
  },
  tableDeleteButton: {
    background: 'rgba(211, 47, 47, 0.9)',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer'
  },
  // ── Advanced Filter styles ──
  filterCard: {
    marginBottom: '20px',
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(21, 101, 192, 0.2)',
    border: '1px solid rgba(100, 181, 246, 0.35)',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)'
  },
  filterHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap'
  },
  filterTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#E3F2FD',
    margin: 0
  },
  filterActiveTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(76, 175, 80, 0.35)',
    color: '#C8E6C9',
    border: '1px solid rgba(76, 175, 80, 0.5)',
    letterSpacing: '0.3px'
  },
  filterFormRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
    alignItems: 'flex-end',
    marginBottom: '16px'
  },
  filterButtonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center'
  },
  filterApplyBtn: {
    background: 'rgba(46, 125, 50, 0.85)',
    border: '2px solid rgba(46, 125, 50, 1)',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 3px 8px rgba(46, 125, 50, 0.4)',
    transition: 'all 0.2s ease'
  },
  filterResetBtn: {
    background: 'rgba(120, 120, 120, 0.55)',
    border: '2px solid rgba(160, 160, 160, 0.5)',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterQuickBtn: {
    background: 'rgba(25, 118, 210, 0.55)',
    border: '2px solid rgba(25, 118, 210, 0.7)',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterQuickBtnActive: {
    boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)',
    transform: 'scale(1.05)'
  },
  insightsSection: {
    marginTop: '48px',
    padding: '24px',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  insightsTitle: {
    fontSize: '24px',
    color: '#ffffff',
    marginBottom: '24px',
    fontWeight: '600'
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px'
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  insightCardTitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '16px',
    fontWeight: '500'
  },
  reportStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 0'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statVal: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff'
  },
  statLab: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px'
  },
  listContainer: {
    maxHeight: '150px',
    overflowY: 'auto',
    paddingRight: '8px'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '14px',
    color: '#ffffff'
  },
  listSub: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  emptyMsg: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic'
  },
  // ── Neo4j Graph Insights styles ──
  neo4jSection: {
    marginTop: '32px',
    padding: '28px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.35) 0%, rgba(13, 71, 161, 0.2) 100%)',
    border: '1px solid rgba(100, 181, 246, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  },
  neo4jHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px'
  },
  neo4jTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 4px 0',
    letterSpacing: '0.3px'
  },
  neo4jSubtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
    fontWeight: 300
  },
  neo4jSyncBtn: {
    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.7), rgba(13, 71, 161, 0.85))',
    border: '2px solid rgba(100, 181, 246, 0.5)',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
    transition: 'all 0.25s ease',
    whiteSpace: 'nowrap'
  },
  neo4jSyncMsg: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px'
  },
  neo4jSummaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  neo4jSummaryCard: {
    padding: '16px 12px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    textAlign: 'center',
    transition: 'all 0.25s ease'
  },
  neo4jSummaryIcon: {
    fontSize: '24px',
    marginBottom: '6px'
  },
  neo4jSummaryVal: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2
  },
  neo4jSummaryLab: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px'
  },
  neo4jTabRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  neo4jTab: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  neo4jTabActive: {
    background: 'rgba(25, 118, 210, 0.35)',
    borderColor: 'rgba(100, 181, 246, 0.6)',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(25, 118, 210, 0.3)'
  },
  neo4jQueryRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  neo4jQueryInput: {
    flex: 1,
    minWidth: '200px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.25s ease'
  },
  neo4jQueryBtn: {
    background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.85), rgba(27, 94, 32, 0.9))',
    border: '2px solid rgba(46, 125, 50, 0.9)',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.35)',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap'
  },
  neo4jCypherHint: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '16px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    overflowX: 'auto'
  },
  neo4jCypherCode: {
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: 'rgba(129, 199, 132, 0.9)',
    fontSize: '11px'
  },
  neo4jError: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 152, 0, 0.15)',
    border: '1px solid rgba(255, 183, 77, 0.3)',
    color: '#ffcc80',
    fontSize: '13px',
    marginBottom: '16px'
  },
  neo4jResultsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px'
  },
  neo4jResultCard: {
    padding: '14px 18px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease'
  },
  neo4jResultChain: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px'
  },
  neo4jNodeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 12px',
    borderRadius: '8px',
    background: 'rgba(46, 125, 50, 0.2)',
    border: '1px solid rgba(76, 175, 80, 0.4)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600
  },
  neo4jNodeIcon: {
    fontSize: '14px'
  },
  neo4jArrow: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: '16px',
    fontWeight: 700
  },
  neo4jResultDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.55)',
    paddingLeft: '4px',
    flexWrap: 'wrap'
  },
  // ── Worker Load Analysis styles ──
  neo4jLoadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '14px',
    marginTop: '8px'
  },
  neo4jLoadCard: {
    padding: '18px 20px',
    borderRadius: '14px',
    border: '1px solid',
    transition: 'all 0.25s ease'
  },
  neo4jLoadTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '12px'
  },
  neo4jLoadWorker: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  neo4jLoadName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2
  },
  neo4jLoadId: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: 500
  },
  neo4jLoadBadge: {
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid',
    whiteSpace: 'nowrap',
    letterSpacing: '0.3px'
  },
  neo4jLoadBar: {
    marginTop: '4px'
  },
  neo4jLoadBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '6px'
  },
  neo4jLoadBarTrack: {
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.08)',
    overflow: 'visible',
    position: 'relative'
  },
  neo4jLoadBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  },
  neo4jLoadThreshold: {
    position: 'absolute',
    left: '50%',
    top: '-2px',
    width: '2px',
    height: '12px',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '1px'
  },
  // ── Dashboard Schedule Explorer styles ──
  dashExplorerSection: {
    marginTop: '32px',
    padding: '28px',
    borderRadius: '18px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(100, 181, 246, 0.25)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  },
  dashExplorerTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 4px 0',
    letterSpacing: '0.3px'
  },
  dashExplorerSubtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.65)',
    margin: '0 0 20px 0',
    fontWeight: 300
  },
  dashExplorerFilterCard: {
    padding: '20px',
    borderRadius: '14px',
    background: 'rgba(21, 101, 192, 0.15)',
    border: '1px solid rgba(100, 181, 246, 0.3)',
    marginBottom: '20px'
  },
  dashExplorerFilterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '14px',
    alignItems: 'flex-end',
    marginBottom: '16px'
  },
  dashExplorerField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  dashExplorerLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  dashExplorerInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.25s ease'
  },
  dashExplorerSelect: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.25s ease'
  },
  dashExplorerBtnRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  dashExplorerSearchBtn: {
    background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.85), rgba(27, 94, 32, 0.9))',
    border: '2px solid rgba(46, 125, 50, 0.9)',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.35)',
    transition: 'all 0.25s ease'
  },
  dashExplorerResetBtn: {
    background: 'rgba(120, 120, 120, 0.5)',
    border: '2px solid rgba(160, 160, 160, 0.45)',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.25s ease'
  },
  dashExplorerQuickBtn: {
    background: 'rgba(25, 118, 210, 0.45)',
    border: '2px solid rgba(25, 118, 210, 0.6)',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.25s ease'
  },
  dashExplorerQuickBtnActive: {
    boxShadow: '0 0 14px rgba(255, 255, 255, 0.25)',
    transform: 'scale(1.04)',
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  dashExplorerActiveTag: {
    marginTop: '4px',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(76, 175, 80, 0.3)',
    color: '#C8E6C9',
    border: '1px solid rgba(76, 175, 80, 0.45)',
    display: 'inline-block',
    letterSpacing: '0.3px'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: rgba(255, 255, 255, 0.6) !important;
    background: rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1) !important;
  }
  
  input::placeholder, textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  select option {
    background: #2E7D32;
    color: #ffffff;
  }
  
  button:hover {
    background: rgba(255, 255, 255, 0.25) !important;
  }
  
  button:active {
    transform: scale(0.98) !important;
  }
  
  @media (max-width: 768px) {
    .authButton:hover, .primaryButton:hover {
      transform: translateY(0) !important;
    }
    
    .officerShell {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      min-height: auto;
      position: relative;
    }
    
    .dataPageHeader {
      flex-direction: column;
    }
    
    .dbmsInfoGrid {
      grid-template-columns: 1fr;
    }
    
    .summaryGrid {
      grid-template-columns: 1fr;
    }
  }
  /* Table UX improvements */
  .dataTable thead th {
    position: sticky;
    top: 0;
    z-index: 5;
    backdrop-filter: blur(6px);
  }

  .dataTable tbody tr:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    transform: scale(1.01);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .dataTable tbody tr {
    cursor: pointer;
  }

  /* Status badge colors for Active / Inactive */
  .status-active {
    background-color: rgba(46, 125, 50, 0.15) !important;
    color: #C8E6C9 !important;
  }

  .status-inactive {
    background-color: rgba(244, 81, 30, 0.15) !important;
    color: #FFCCBC !important;
  }
`;
document.head.appendChild(styleSheet);

export default App;
