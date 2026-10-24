import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { profileAPI } from '../services/api.js';
import {
  User,
  Mail,
  Briefcase,
  Award,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateUserState } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('Software Developer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileAPI.getProfile();
        if (res && res.profile) {
          const p = res.profile;
          setProfile(p);
          setName(p.name || '');
          setTargetRole(p.targetRole || 'Software Developer');
          setExperienceLevel(p.experienceLevel || 'Fresher');
          setBio(p.bio || '');
          setSkills(p.skills || []);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setErrorMsg('Failed to load profile information.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await profileAPI.updateProfile({
        name,
        targetRole,
        experienceLevel,
        bio,
        skills,
      });

      if (res && res.profile) {
        setProfile(res.profile);
        updateUserState(res.profile);
        setSuccessMsg('Profile information updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Candidate Profile
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Manage your career aspirations, target skills, and interview credentials
            </p>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ color: '#dc2626' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Statistics Summary */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-metric-card">
            <div className="stat-icon blue">
              <Award size={24} />
            </div>
            <div className="stat-details">
              <h3>{profile?.stats?.completedInterviews ?? 0}</h3>
              <span>Completed Sessions</span>
            </div>
          </div>

          <div className="stat-metric-card">
            <div className="stat-icon green">
              <Award size={24} />
            </div>
            <div className="stat-details">
              <h3>{profile?.stats?.averageScore ? `${profile.stats.averageScore}/100` : 'N/A'}</h3>
              <span>Placement Score Average</span>
            </div>
          </div>

          <div className="stat-metric-card">
            <div className="stat-icon purple">
              <Briefcase size={24} />
            </div>
            <div className="stat-details">
              <h3>{skills.length}</h3>
              <span>Skills Targeted</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="card">
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.2rem' }}>
            Personal & Career Details
          </h3>

          <div className="setup-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={profile?.email || ''}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <span className="form-hint">Email is linked to your secure login.</span>
            </div>
          </div>

          <div className="setup-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="targetRole">
                Target Job Role
              </label>
              <select
                id="targetRole"
                className="form-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="Software Developer">Software Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Java Developer">Java Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="experienceLevel">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                className="form-select"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="Fresher">Fresher (College Student)</option>
                <option value="Intermediate">Intermediate (1-3 yrs)</option>
                <option value="Experienced">Experienced (3+ yrs)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">
              Brief Bio & Placement Goals
            </label>
            <textarea
              id="bio"
              className="form-textarea"
              style={{ minHeight: '90px' }}
              placeholder="e.g. Final year Computer Science student targeting SDE roles in top product companies."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            ></textarea>
          </div>

          {/* Skills Management */}
          <div className="form-group">
            <label className="form-label">
              Skills & Core Technologies
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: '280px' }}
                placeholder="Add skill (e.g. Next.js, Docker, Java)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#c7d2fe',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{skill}</span>
                  <X
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
