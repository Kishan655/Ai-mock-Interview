import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewAPI } from '../services/api.js';
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  RotateCcw,
  ListChecks,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Printer,
  Check,
  XCircle
} from 'lucide-react';

export default function ResultsPage() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await interviewAPI.getInterviewById(id);
        if (res && res.interview) {
          setInterview(res.interview);
        } else {
          setError('Interview report not found.');
        }
      } catch (err) {
        console.error('Failed to load interview report:', err);
        setError(err.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? -1 : idx);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Compiling your placement evaluation report...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="auth-alert-error" style={{ maxWidth: '480px', margin: '0 auto 1.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error || 'Unable to retrieve interview results.'}</span>
        </div>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const {
    jobRole,
    experienceLevel,
    interviewType,
    difficulty,
    overallScore = 0,
    categoryScores = {},
    strengths = [],
    weaknesses = [],
    improvementPlan = [],
    recommendedTopics = [],
    questions = [],
    createdAt,
  } = interview;

  return (
    <div className="page-wrapper">
      {/* Top Banner / Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Evaluation Report: {jobRole}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            {experienceLevel} Level • {interviewType} Round • {difficulty} Difficulty
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          <Link to="/interview/setup" className="btn btn-primary btn-sm">
            <RotateCcw size={16} />
            <span>Practice Another</span>
          </Link>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="results-hero-card">
        <div className="overall-score-circle">
          <div className="overall-score-num">{overallScore}</div>
          <div className="overall-score-denom">OUT OF 100</div>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {overallScore >= 80 ? '🎉 Placement Ready Performance!' : overallScore >= 65 ? '👍 Solid Effort - Good Foundation' : '📚 Needs Practice & Conceptual Revision'}
        </h2>
        <p style={{ color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', fontSize: '0.98rem' }}>
          {overallScore >= 80
            ? 'Your answers showed strong technical depth, clear reasoning, and good communication. You are well positioned for campus drives!'
            : overallScore >= 65
            ? 'You demonstrated knowledge of core concepts. Deepening your explanations with concrete examples and trade-offs will bump your score to the 90s.'
            : 'Focus on strengthening foundational terminology, understanding system mechanisms, and formulating structured responses.'}
        </p>
      </div>

      {/* 4 Core Dimensions */}
      <div className="results-categories-grid">
        <div className="category-stat-pill">
          <div className="category-stat-num">{categoryScores.technicalKnowledge ?? 0}%</div>
          <div className="category-stat-label">Technical Knowledge</div>
        </div>

        <div className="category-stat-pill">
          <div className="category-stat-num" style={{ color: '#8b5cf6' }}>{categoryScores.problemSolving ?? 0}%</div>
          <div className="category-stat-label">Problem Solving</div>
        </div>

        <div className="category-stat-pill">
          <div className="category-stat-num" style={{ color: '#10b981' }}>{categoryScores.communication ?? 0}%</div>
          <div className="category-stat-label">Communication & Clarity</div>
        </div>

        <div className="category-stat-pill">
          <div className="category-stat-num" style={{ color: '#f59e0b' }}>{categoryScores.answerRelevance ?? 0}%</div>
          <div className="category-stat-label">Answer Relevance</div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="insights-grid">
        {/* Strengths */}
        <div className="insight-card">
          <div className="insight-header green">
            <CheckCircle2 size={22} />
            <span>Key Strengths Observed</span>
          </div>
          <ul className="insight-list">
            {strengths && strengths.length > 0 ? (
              strengths.map((s, i) => (
                <li key={i} className="insight-item">
                  <Check size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{s}</span>
                </li>
              ))
            ) : (
              <li className="insight-item">Demonstrated good effort formulating responses across questions.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="insight-card">
          <div className="insight-header amber">
            <AlertTriangle size={22} />
            <span>Areas For Improvement</span>
          </div>
          <ul className="insight-list">
            {weaknesses && weaknesses.length > 0 ? (
              weaknesses.map((w, i) => (
                <li key={i} className="insight-item">
                  <XCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{w}</span>
                </li>
              ))
            ) : (
              <li className="insight-item">Practice stating definitions clearly and citing architectural trade-offs.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Actionable Improvement Roadmap */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <ListChecks size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Personalized 5-Step Placement Roadmap</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {improvementPlan && improvementPlan.length > 0 ? (
            improvementPlan.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  padding: '0.9rem 1.1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.94rem', color: '#f8fafc', lineHeight: 1.55 }}>
                  {step}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Focus on daily technical problem solving and mock practice.</p>
          )}
        </div>
      </div>

      {/* Recommended Topics to Study */}
      {recommendedTopics && recommendedTopics.length > 0 && (
        <div className="card" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <BookOpen size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Recommended Topics To Revise</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {recommendedTopics.map((topic, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#c7d2fe',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} color="#38bdf8" />
                <span>{topic}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question-Wise Detailed Analysis */}
      <div>
        <div style={{ marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Question-by-Question Detailed Feedback</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Click on any question to examine your answer, Gemini critique, and suggested ideal model answer
          </p>
        </div>

        {questions.map((q, idx) => {
          const isExpanded = expandedIndex === idx;
          const isSkipped = !q.candidateAnswer || !q.candidateAnswer.trim();

          return (
            <div key={idx} className="review-item">
              <div
                className="review-item-header"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleExpand(idx)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      Q{idx + 1} • {q.questionType || 'Technical'}
                    </span>
                    {q.timeSpentSeconds > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Time: {q.timeSpentSeconds}s
                      </span>
                    )}
                  </div>
                  <h4 className="review-item-title">{q.questionText}</h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      padding: '0.3rem 0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      background: q.score >= 75 ? '#ecfdf5' : q.score >= 50 ? '#fffbeb' : '#fef2f2',
                      color: q.score >= 75 ? '#065f46' : q.score >= 50 ? '#92400e' : '#991b1b',
                    }}
                  >
                    {isSkipped ? 'Skipped (0/100)' : `${q.score} / 100`}
                  </span>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-light)' }}>
                  {/* Candidate's Answer */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Your Answer:
                    </span>
                    <p style={{ marginTop: '0.3rem', fontSize: '0.95rem', color: isSkipped ? '#94a3b8' : 'var(--text-primary)', fontStyle: isSkipped ? 'italic' : 'normal' }}>
                      {isSkipped ? '(Candidate skipped this question without submitting an answer)' : q.candidateAnswer}
                    </p>
                  </div>

                  {/* AI Feedback */}
                  {q.feedback && (
                    <div className="review-feedback-box">
                      <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                        Gemini AI Assessment & Feedback:
                      </strong>
                      <p>{q.feedback}</p>
                    </div>
                  )}

                  {/* Suggested Ideal Answer */}
                  {q.suggestedAnswer && (
                    <div className="review-suggested-box">
                      <strong style={{ display: 'block', color: '#047857', marginBottom: '0.3rem' }}>
                        Suggested Ideal Model Answer:
                      </strong>
                      <p>{q.suggestedAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem' }}>
        <Link to="/interview/setup" className="btn btn-primary btn-lg">
          <span>Start Another Mock Session</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
