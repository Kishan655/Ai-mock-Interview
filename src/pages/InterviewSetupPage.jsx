import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api.js';
import {
  PlayCircle,
  Briefcase,
  Layers,
  Sliders,
  Check,
  Plus,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const PRESET_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Java Developer',
  'Data Analyst',
  'Custom Role',
];

const PRESET_SKILLS = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Node.js',
  'Express.js',
  'MongoDB',
  'Java',
  'SQL',
  'Data Structures & Algorithms',
  'System Design',
  'REST APIs',
  'Git',
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('Software Developer');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [selectedSkills, setSelectedSkills] = useState(['JavaScript', 'React', 'Node.js']);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      setCustomSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setError('');

    const finalRole = selectedRole === 'Custom Role' ? customRole.trim() : selectedRole;
    if (!finalRole) {
      setError('Please specify your custom job role.');
      return;
    }

    setLoading(true);
    try {
      const response = await interviewAPI.createInterview({
        jobRole: finalRole,
        experienceLevel,
        interviewType,
        difficulty,
        skills: selectedSkills,
        totalQuestions: Number(totalQuestions),
      });

      if (response && response.interview) {
        navigate(`/interview/${response.interview._id || response.interview.id}`);
      } else {
        throw new Error('Interview initialization failed.');
      }
    } catch (err) {
      console.error('Interview creation error:', err);
      setError(err.message || 'Failed to initialize AI interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="setup-container">
        <div className="setup-header">
          <div style={{ display: 'inline-flex', padding: '0.6rem', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', marginBottom: '0.8rem' }}>
            <Sliders size={28} />
          </div>
          <h1>Configure Your AI Mock Interview</h1>
          <p>Tailor questions to your dream job description and current preparation level</p>
        </div>

        {error && (
          <div className="auth-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStartInterview} className="card">
          {/* 1. Job Role */}
          <div className="form-group">
            <label className="form-label">1. Target Job Role</label>
            <div className="pills-group">
              {PRESET_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  className={`pill-option ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>

            {selectedRole === 'Custom Role' && (
              <div style={{ marginTop: '0.8rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DevOps Engineer, Machine Learning Intern, Mobile App Developer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

          {/* 2 & 3. Experience Level & Interview Type */}
          <div className="setup-grid">
            <div className="form-group">
              <label className="form-label">2. Experience Level</label>
              <div className="pills-group">
                {['Fresher', 'Intermediate', 'Experienced'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    className={`pill-option ${experienceLevel === lvl ? 'active' : ''}`}
                    onClick={() => setExperienceLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">3. Interview Type</label>
              <div className="pills-group">
                {['Mixed', 'Technical', 'HR', 'Behavioral'].map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`pill-option ${interviewType === type ? 'active' : ''}`}
                    onClick={() => setInterviewType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 & 5. Difficulty & Question Count */}
          <div className="setup-grid" style={{ marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">4. Difficulty Level</label>
              <div className="pills-group">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    type="button"
                    key={diff}
                    className={`pill-option ${difficulty === diff ? 'active' : ''}`}
                    onClick={() => setDifficulty(diff)}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">5. Number of Questions</label>
              <div className="pills-group">
                {[5, 10, 15].map((cnt) => (
                  <button
                    type="button"
                    key={cnt}
                    className={`pill-option ${totalQuestions === cnt ? 'active' : ''}`}
                    onClick={() => setTotalQuestions(cnt)}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

          {/* 6. Skills to Test */}
          <div className="form-group">
            <label className="form-label">6. Skills & Technologies to Cover</label>
            <p className="form-hint" style={{ marginBottom: '0.6rem' }}>
              Select all relevant skills to guide the interview question generation:
            </p>

            <div className="skills-tags-container">
              {PRESET_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleToggleSkill(skill)}
                    className={`skill-tag ${isSelected ? 'selected' : ''}`}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: '300px' }}
                placeholder="Add other skill (e.g. Docker, Redux)"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
                <span>Add Skill</span>
              </button>
            </div>

            {/* Currently Selected List */}
            {selectedSkills.length > 0 && (
              <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.4rem' }}>
                  Selected:
                </span>
                {selectedSkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#c7d2fe',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {s}
                    <X
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveSkill(s)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '2.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating Interview Session...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={20} />
                  <span>Start Interview Now</span>
                </>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
              Preparing {totalQuestions} role-specific interview questions with live evaluation and instant feedback.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
