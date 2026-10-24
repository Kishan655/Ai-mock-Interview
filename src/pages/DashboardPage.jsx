import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardAPI } from '../services/api.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  PlayCircle,
  Trophy,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  Clock,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Award,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartView, setChartView] = useState('overall'); // 'overall' | 'breakdown'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardAPI.getStats();
        if (res && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard metrics. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-box">
          <div className="chart-tooltip-title">
            <span>{data.role || 'Interview Session'}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.6rem' }}>
              {data.date}
            </span>
          </div>
          <div className="chart-tooltip-row">
            <span style={{ color: '#818cf8', fontWeight: 600 }}>Overall Score:</span>
            <span className="chart-tooltip-score">{data.overallScore} / 100</span>
          </div>
          {data.technicalKnowledge !== undefined && (
            <div className="chart-tooltip-row">
              <span style={{ color: '#94a3b8' }}>Technical:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{data.technicalKnowledge}%</span>
            </div>
          )}
          {data.problemSolving !== undefined && (
            <div className="chart-tooltip-row">
              <span style={{ color: '#94a3b8' }}>Problem Solving:</span>
              <span style={{ fontWeight: 600, color: '#a78bfa' }}>{data.problemSolving}%</span>
            </div>
          )}
          {data.communication !== undefined && (
            <div className="chart-tooltip-row">
              <span style={{ color: '#94a3b8' }}>Communication:</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>{data.communication}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'badge badge-ready';
    if (score >= 60) return 'badge badge-intermediate';
    return 'badge badge-needs-practice';
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your interview analytics...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Candidate Dashboard
            </span>
            <span style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
              {user?.targetRole || 'Software Developer'} • {user?.experienceLevel || 'Fresher'}
            </span>
          </div>
          <h1>Welcome, {user?.name}!</h1>
          <p>
            Track your mock interview scores, study weak areas, and level up your placement readiness.
          </p>
        </div>

        <Link to="/interview/setup" className="btn btn-primary btn-lg">
          <PlayCircle size={20} />
          <span>Start New Interview</span>
        </Link>
      </div>

      {error && (
        <div className="auth-alert-error" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-metric-card">
          <div className="stat-icon blue">
            <Trophy size={26} />
          </div>
          <div className="stat-details">
            <h3>{stats?.totalInterviewsCompleted ?? 0}</h3>
            <span>Interviews Completed</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon green">
            <Award size={26} />
          </div>
          <div className="stat-details">
            <h3>{stats?.averageScore ? `${stats.averageScore}/100` : 'N/A'}</h3>
            <span>Average Score</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon amber">
            <TrendingUp size={26} />
          </div>
          <div className="stat-details">
            <div style={{ marginTop: '0.2rem' }}>
              <span className={getScoreBadgeClass(stats?.averageScore || 0)}>
                {stats?.readiness || 'Needs Practice'}
              </span>
            </div>
            <span style={{ display: 'block', marginTop: '0.3rem' }}>Readiness Level</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon purple">
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-details">
            <h3>{stats?.totalQuestionsAnswered ?? 0}</h3>
            <span>Questions Solved</span>
          </div>
        </div>
      </div>

      {/* Performance Trend Line Chart (Recharts) */}
      <div className="performance-chart-card">
        <div className="chart-header-row">
          <div className="chart-title-group">
            <h3>
              <Activity size={22} color="#818cf8" />
              <span>Performance Trend & Score Progression</span>
            </h3>
            <p>
              Track your mock interview score improvement across sessions over time
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div className="chart-legend-pills">
              <span className="chart-legend-pill">
                <span className="chart-dot indigo"></span>
                <span>Overall Score</span>
              </span>
              {chartView === 'breakdown' && (
                <>
                  <span className="chart-legend-pill">
                    <span className="chart-dot cyan"></span>
                    <span>Technical</span>
                  </span>
                  <span className="chart-legend-pill">
                    <span className="chart-dot emerald"></span>
                    <span>Communication</span>
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setChartView('overall')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: chartView === 'overall' ? '#ffffff' : '#94a3b8',
                  background: chartView === 'overall' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                Overall
              </button>
              <button
                type="button"
                onClick={() => setChartView('breakdown')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: chartView === 'breakdown' ? '#ffffff' : '#94a3b8',
                  background: chartView === 'breakdown' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                Multi-Skill
              </button>
            </div>
          </div>
        </div>

        {stats?.scoreTrend && stats.scoreTrend.length > 0 ? (
          <div style={{ width: '100%', height: 300, marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.scoreTrend}
                margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={75}
                  stroke="rgba(16, 185, 129, 0.45)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Placement Ready (75%+)',
                    position: 'insideTopRight',
                    fill: '#34d399',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  name="Overall Score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#818cf8', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                />
                {chartView === 'breakdown' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="technicalKnowledge"
                      name="Technical"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 4, fill: '#06b6d4' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="communication"
                      name="Communication"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 4, fill: '#10b981' }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <TrendingUp size={38} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
              No Interview Score History Yet
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.3rem' }}>
              Take your first mock interview to generate your personalized performance curve and track score gains over time.
            </p>
            <Link to="/interview/setup" className="btn btn-primary btn-sm">
              <PlayCircle size={16} />
              <span>Start Your First Interview</span>
            </Link>
          </div>
        )}
      </div>

      {/* Category Breakdown & Recommended Topics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Performance Breakdown */}
        <div className="category-progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Performance Breakdown</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>4 Core Dimensions</span>
          </div>

          <div className="category-bar-row">
            <div className="category-bar-header">
              <span>Technical Knowledge</span>
              <span>{stats?.categoryAverages?.technicalKnowledge ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill blue"
                style={{ width: `${stats?.categoryAverages?.technicalKnowledge ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="category-bar-row">
            <div className="category-bar-header">
              <span>Problem Solving & Reasoning</span>
              <span>{stats?.categoryAverages?.problemSolving ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill purple"
                style={{ width: `${stats?.categoryAverages?.problemSolving ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="category-bar-row">
            <div className="category-bar-header">
              <span>Communication & Clarity</span>
              <span>{stats?.categoryAverages?.communication ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill green"
                style={{ width: `${stats?.categoryAverages?.communication ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="category-bar-row">
            <div className="category-bar-header">
              <span>Answer Relevance & Conciseness</span>
              <span>{stats?.categoryAverages?.answerRelevance ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill amber"
                style={{ width: `${stats?.categoryAverages?.answerRelevance ?? 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recommended Topics */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
            <BookOpen size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recommended Topics</h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            Topics identified by Gemini AI based on your interview answers to revise next:
          </p>

          {stats?.recommendedTopics && stats.recommendedTopics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {stats.recommendedTopics.map((topic, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={14} color="#818cf8" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Complete your first interview to generate personalized study recommendations!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Interviews Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Interview Sessions</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Review past question reports and score progression
            </p>
          </div>

          <Link to="/history" className="btn btn-secondary btn-sm">
            <span>View All History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {stats?.recentInterviews && stats.recentInterviews.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Target Role</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInterviews.map((interview) => (
                  <tr key={interview._id}>
                    <td>
                      {new Date(interview.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td><strong>{interview.jobRole}</strong></td>
                    <td>{interview.interviewType}</td>
                    <td>{interview.difficulty}</td>
                    <td>
                      <span className={`badge ${interview.status === 'completed' ? 'badge-completed' : 'badge-in-progress'}`}>
                        {interview.status}
                      </span>
                    </td>
                    <td>
                      {interview.status === 'completed' ? (
                        <span className={getScoreBadgeClass(interview.overallScore)}>
                          {interview.overallScore} / 100
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Incomplete</span>
                      )}
                    </td>
                    <td>
                      {interview.status === 'completed' ? (
                        <Link
                          to={`/interview/${interview._id}/results`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          to={`/interview/${interview._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Resume
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)' }}>
            <Clock size={36} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              No mock interviews conducted yet
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Set up your target role and skills to start your first AI mock interview session.
            </p>
            <Link to="/interview/setup" className="btn btn-primary">
              <PlayCircle size={18} />
              <span>Launch Your First Interview</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
