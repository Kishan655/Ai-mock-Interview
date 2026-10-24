import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewAPI } from '../services/api.js';
import {
  History as HistoryIcon,
  Trash2,
  Eye,
  PlayCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter
} from 'lucide-react';

export default function HistoryPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const fetchInterviews = async () => {
    try {
      const res = await interviewAPI.getInterviews();
      if (res && res.interviews) {
        setInterviews(res.interviews);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.message || 'Failed to fetch interview history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await interviewAPI.deleteInterview(deleteTarget._id || deleteTarget.id);
      setInterviews((prev) => prev.filter((i) => (i._id || i.id) !== (deleteTarget._id || deleteTarget.id)));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete interview error:', err);
      setError(err.message || 'Failed to delete interview session.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = interviews.filter((item) => {
    const matchesSearch =
      item.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.difficulty || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'All' ? true : item.interviewType === filterType;

    return matchesSearch && matchesType;
  });

  const getScoreBadge = (score) => {
    if (score >= 80) return 'badge badge-ready';
    if (score >= 60) return 'badge badge-intermediate';
    return 'badge badge-needs-practice';
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your interview history...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Interview History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Review your past mock sessions, monitor progress, and inspect feedback reports
          </p>
        </div>

        <Link to="/interview/setup" className="btn btn-primary">
          <PlayCircle size={18} />
          <span>Start New Interview</span>
        </Link>
      </div>

      {error && (
        <div className="auth-alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '220px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', padding: '0.4rem 0', boxShadow: 'none' }}
            placeholder="Search by job role or difficulty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.88rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Technical">Technical</option>
            <option value="HR">HR</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Interviews Table or Empty State */}
      {filtered.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Job Role</th>
                <th>Type</th>
                <th>Level</th>
                <th>Difficulty</th>
                <th>Questions</th>
                <th>Score</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const id = item._id || item.id;
                const isCompleted = item.status === 'completed';

                return (
                  <tr key={id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{item.jobRole}</strong>
                    </td>
                    <td>{item.interviewType}</td>
                    <td>{item.experienceLevel}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{item.difficulty}</span>
                    </td>
                    <td>
                      {item.questions?.length || item.totalQuestions} Questions
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className={getScoreBadge(item.overallScore)}>
                          {item.overallScore} / 100
                        </span>
                      ) : (
                        <span className="badge badge-in-progress">In Progress</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {isCompleted ? (
                          <Link
                            to={`/interview/${id}/results`}
                            className="btn btn-secondary btn-sm"
                            title="View detailed evaluation report"
                          >
                            <Eye size={14} />
                            <span>View Report</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/interview/${id}`}
                            className="btn btn-primary btn-sm"
                            title="Resume session"
                          >
                            <PlayCircle size={14} />
                            <span>Resume</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626' }}
                          title="Delete interview session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <HistoryIcon size={44} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            No matching interview sessions found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {interviews.length === 0
              ? 'You have not conducted any mock interviews yet. Set up your first session to practice with Gemini AI.'
              : 'Try clearing your search query or selecting "All Types".'}
          </p>
          <Link to="/interview/setup" className="btn btn-primary">
            <PlayCircle size={18} />
            <span>Launch Mock Interview</span>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Delete Interview Record?</h3>
            <p className="modal-desc">
              Are you sure you want to permanently delete the mock interview session for{' '}
              <strong>{deleteTarget.jobRole}</strong> ({new Date(deleteTarget.createdAt).toLocaleDateString()})?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
