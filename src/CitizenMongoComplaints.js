import React, { useState, useEffect, useCallback } from 'react';
import './CitizenMongoComplaints.css';

const API_BASE = 'http://localhost:5000';

function CitizenMongoComplaints({ onBack, userName }) {
  const [form, setForm] = useState({
    citizen_name: userName || '',
    issue: '',
    description: '',
    location: ''
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitMsg, setSubmitMsg] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_name: form.citizen_name,
          issue: form.issue,
          description: form.description,
          location: form.location
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      setSubmitMsg('Complaint submitted successfully.');
      setForm((f) => ({ ...f, issue: '', description: '', location: '' }));
      await loadComplaints();
    } catch (err) {
      setSubmitMsg(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="mongo-complaints-wrap">
      <div className="mongo-complaints-banner"></div>

      <div className="mongo-complaints-header">
        <button type="button" className="mongo-complaints-back" onClick={onBack}>
          ← Back
        </button>
        <h2 className="mongo-complaints-title">Citizen Complaints</h2>
      </div>

      <p className="mongo-complaints-note">
      </p>

      <form className="mongo-complaints-form" onSubmit={handleSubmit}>
        <h3>New complaint</h3>
        <label>
          Citizen name
          <input
            value={form.citizen_name}
            onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
            required
          />
        </label>
        <label>
          Issue
          <input
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
            required
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </label>
        <label>
          Location
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
        </label>
        <button type="submit" className="mongo-complaints-submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit complaint'}
        </button>
        {submitMsg && <p className="mongo-complaints-msg">{submitMsg}</p>}
      </form>

      <section className="mongo-complaints-list-section">
        <h3>Complaint list</h3>
        {listLoading && <p className="mongo-complaints-muted">Loading…</p>}
        {error && <p className="mongo-complaints-err">{error}</p>}
        {!listLoading && !error && complaints.length === 0 && (
          <p className="mongo-complaints-empty">No complaints yet.</p>
        )}
        <ul className="mongo-complaints-list">
          {complaints.map((c) => (
            <li key={c._id} className="mongo-complaints-card">
              <div className="mongo-complaints-row">
                <div>
                  <div className="mongo-complaints-issue">{c.issue}</div>
                  <div className="mongo-complaints-location">📍 {c.location}</div>
                </div>
                <span className="mongo-status-badge">{c.status}</span>
              </div>
              <div className="mongo-complaints-actions">
                <label>
                  Status:
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c._id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default CitizenMongoComplaints;
