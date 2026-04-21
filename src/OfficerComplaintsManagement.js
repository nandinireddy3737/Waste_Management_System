import React, { useState, useEffect, useCallback } from 'react';
import './OfficerComplaintsManagement.css';

const API_BASE = 'http://localhost:5000';

/**
 * Municipal Officer: view + update citizen complaints (MongoDB only).
 * No form — citizens submit via Citizen Complaints module.
 */
function OfficerComplaintsManagement({ onBack }) {
  const [complaints, setComplaints] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComplaints = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/complaints`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setComplaints(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Could not load complaints. Is MongoDB running?');
      setComplaints([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const [expandedId, setExpandedId] = useState(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsType, setAnalyticsType] = useState(null); // 'status' | 'location' | 'active' | 'analysis'
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/complaint/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await loadComplaints();
    } catch (err) {
      window.alert(err.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      const res = await fetch(`${API_BASE}/complaint/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await loadComplaints();
    } catch (err) {
      window.alert(err.message || 'Delete failed');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const fetchAnalytics = async (endpoint, type) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalyticsType(type);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load analytics');
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err.message || 'Error loading insights');
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  return (
    <div className="officer-complaints-wrap">
      <div className="officer-complaints-banner"></div>

      <div className="officer-complaints-header">
        <button type="button" className="officer-complaints-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <h2 className="officer-complaints-title">Municipal Complaint Management</h2>
      <p className="officer-complaints-sub">

      </p>

      {listLoading && <p className="officer-complaints-muted">Loading complaints…</p>}
      {error && <p className="officer-complaints-err">{error}</p>}

      {!listLoading && !error && complaints.length === 0 && (
        <p className="officer-complaints-empty">No complaints submitted yet.</p>
      )}

      <ul className="officer-complaints-list">
        {complaints.map((c) => (
          <li key={c._id} className="officer-complaints-card">
            <div className="officer-complaints-row">
              <div>
                <div className="officer-complaints-issue">{c.issue}</div>
                <div className="officer-complaints-location">📍 {c.location}</div>
              </div>
              <span className="officer-status-badge">{c.status}</span>
            </div>
            <div className="officer-complaints-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label>
                Update status:
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c._id, e.target.value)}
                  style={{ marginLeft: '6px' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </label>
              <button 
                type="button"
                onClick={() => toggleExpand(c._id)} 
                style={{ cursor: 'pointer', background: 'rgba(25, 118, 210, 0.8)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
              >
                {expandedId === c._id ? 'Hide Details' : 'View Details'}
              </button>
              <button 
                type="button"
                onClick={() => handleDelete(c._id)}
                style={{ cursor: 'pointer', background: 'rgba(211, 47, 47, 0.8)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
              >
                Delete
              </button>
            </div>
            
            {expandedId === c._id && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#e0e0e0' }}><strong>Description:</strong> {c.description}</p>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#e0e0e0' }}><strong>Created AT:</strong> {new Date(c.created_at).toLocaleString()}</p>
                
                <div style={{ marginTop: '16px' }}>
                  <strong>Updates History:</strong>
                  {c.updates && c.updates.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, marginTop: '8px' }}>
                      {c.updates.map((upd, idx) => (
                        <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#ccc' }}>
                          <span style={{ color: '#90caf9' }}>{new Date(upd.at).toLocaleString()}</span> — Status changed to <strong>{upd.status}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#aaa', margin: '4px 0 0 0' }}>No updates yet.</p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Analytics Section using MongoDB aggregations */}
      <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(21, 101, 192, 0.15)', borderRadius: '16px', border: '1px solid rgba(100, 181, 246, 0.3)' }}>
        <h3 style={{ fontSize: '20px', color: '#fff', margin: '0 0 16px 0' }}>📊 Complaint Insights</h3>
        <p style={{ fontSize: '14px', color: '#ccc', margin: '0 0 20px 0' }}></p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button 
            type="button"
            onClick={() => fetchAnalytics('complaints-summary-status', 'Status Summary')}
            style={{ cursor: 'pointer', background: 'rgba(25, 118, 210, 0.5)', border: '1px solid rgba(25, 118, 210, 0.8)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
          >
            Status Summary
          </button>
          <button 
            type="button"
            onClick={() => fetchAnalytics('complaints-summary-location', 'Location Summary')}
            style={{ cursor: 'pointer', background: 'rgba(46, 125, 50, 0.5)', border: '1px solid rgba(46, 125, 50, 0.8)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
          >
            Location Summary
          </button>
          <button 
            type="button"
            onClick={() => fetchAnalytics('complaints-active', 'Active Issues')}
            style={{ cursor: 'pointer', background: 'rgba(255, 152, 0, 0.5)', border: '1px solid rgba(255, 152, 0, 0.8)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
          >
            Active Issues
          </button>
          <button 
            type="button"
            onClick={() => fetchAnalytics('complaints-analysis', 'Pending Analysis')}
            style={{ cursor: 'pointer', background: 'rgba(156, 39, 176, 0.5)', border: '1px solid rgba(156, 39, 176, 0.8)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
          >
            Pending Analysis
          </button>
        </div>

        {analyticsLoading && <p style={{ color: '#fff' }}>Crunching numbers in MongoDB...</p>}
        {analyticsError && <p style={{ color: '#ff5252' }}>{analyticsError}</p>}

        {!analyticsLoading && !analyticsError && analyticsData && (
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: '#e3f2fd', margin: '0 0 12px 0' }}>Results: {analyticsType}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Array.isArray(analyticsData) && analyticsData.length > 0 ? (
                analyticsData.map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    {analyticsType === 'Status Summary' && <><div style={{ color: '#aaa', fontSize: '12px' }}>Status</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>{item.status || 'Unknown'} <br/><span style={{ color: '#4caf50', fontSize: '14px', fontWeight: 'normal' }}>{item.count} complaints</span></div></>}
                    {analyticsType === 'Location Summary' && <><div style={{ color: '#aaa', fontSize: '12px' }}>Location</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>{item.location || 'Unknown'} <br/><span style={{ color: '#4caf50', fontSize: '14px', fontWeight: 'normal' }}>{item.count} complaints</span></div></>}
                    {analyticsType === 'Active Issues' && <><div style={{ color: '#aaa', fontSize: '12px' }}>Issue</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>{item.issue}</div><div style={{ fontSize: '13px', color: '#90caf9', marginTop: '4px' }}>📍 {item.location}</div></>}
                    {analyticsType === 'Pending Analysis' && <><div style={{ color: '#aaa', fontSize: '12px' }}>Location</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>{item.location || 'Unknown'} <br/><span style={{ color: '#ff9800', fontSize: '14px', fontWeight: 'normal' }}>{item.count} pending issues</span></div></>}
                  </div>
                ))
              ) : (
                <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>No aggregation data returned.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OfficerComplaintsManagement;
