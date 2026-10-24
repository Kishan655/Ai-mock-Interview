import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  BrainCircuit,
  BarChart3,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  FileCheck,
  Mic,
  Zap,
  Target,
  Award
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <Sparkles size={16} />
            <span>Placement & Tech Interview Preparation Engine</span>
          </div>

          <h1 className="hero-title">
            Practice Smarter. <br />
            <span className="hero-title-highlight">Interview Better.</span>
          </h1>

          <p className="hero-subtitle">
            Master campus placements and software engineering job interviews with realistic,
            interactive technical and HR mock sessions. Get in-depth evaluations,
            constructive feedback, voice dictation, and model answers tailored to your target role.
          </p>

          <div className="hero-cta-group">
            <Link
              to={user ? '/interview/setup' : '/register'}
              className="btn btn-primary btn-lg"
            >
              <span>{user ? 'Launch New Interview' : 'Start Your Interview Free'}</span>
              <ArrowRight size={18} />
            </Link>

            <a href="#how-it-works" className="btn btn-outline-white btn-lg">
              <span>See How It Works</span>
            </a>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-card">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Interview Roles</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value">94%</div>
              <div className="hero-stat-label">Placement Confidence</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value">0.8s</div>
              <div className="hero-stat-label">Instant AI Evaluation</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Student Focused</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section section-light">
        <div className="section-container">
          <div className="section-header">
            <div className="section-tag">Key Platform Capabilities</div>
            <h2 className="section-title">Engineered For Real Job Readiness</h2>
            <p className="section-desc">
              Everything college students and freshers need to conquer grueling technical rounds,
              live coding discussions, and behavioral HR questions.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BrainCircuit size={28} />
              </div>
              <h3 className="feature-card-title">Dynamic Role-Specific Questions</h3>
              <p className="feature-card-desc">
                AI dynamically crafts questions tailored to your exact tech stack (React, Node, Java, MongoDB, Data Analysis) and difficulty level.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BarChart3 size={28} />
              </div>
              <h3 className="feature-card-title">4-Dimension Evaluation Matrix</h3>
              <p className="feature-card-desc">
                Receive granular scores out of 100 on Technical Knowledge, Problem Solving, Communication, and Answer Relevance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Compass size={28} />
              </div>
              <h3 className="feature-card-title">Intelligent Follow-Up Probing</h3>
              <p className="feature-card-desc">
                Just like a senior interviewer at top tech companies, the AI detects nuances in your answers and poses follow-up questions to test your real depth.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Mic size={28} />
              </div>
              <h3 className="feature-card-title">Voice Dictation & Speech Recognition</h3>
              <p className="feature-card-desc">
                Speak your answers naturally using browser speech recognition or type manually with countdown timers under simulated interview pressure.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileCheck size={28} />
              </div>
              <h3 className="feature-card-title">Suggested Ideal Model Answers</h3>
              <p className="feature-card-desc">
                Don't just see your score—learn the exact model answer and trade-offs top candidates articulate during campus placement drives.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={28} />
              </div>
              <h3 className="feature-card-title">Personalized Improvement Roadmaps</h3>
              <p className="feature-card-desc">
                Discover your identified strengths, weaknesses, and an actionable 5-step preparation roadmap with recommended topics to revise before your interviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-tag">Interactive Workflow</div>
            <h2 className="section-title">Your 3-Step Journey to Job Offers</h2>
            <p className="section-desc">
              Practice independently at your own pace anytime, anywhere.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-badge">1</div>
              <h3 className="step-title">Configure Your Session</h3>
              <p className="step-desc">
                Choose your target job role (Frontend, Backend, Java, Full Stack, Data Analyst), experience tier (Fresher to Experienced), interview type, and specific skills.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge">2</div>
              <h3 className="step-title">Enter The AI Room</h3>
              <p className="step-desc">
                Face realistic questions one-by-one with interactive countdown timers. Dictate by voice or type your answers and receive dynamic follow-ups based on your explanation.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge">3</div>
              <h3 className="step-title">Review Detailed Report</h3>
              <p className="step-desc">
                Inspect your overall score, category breakdown, question-wise critique, model answers, and study suggestions saved securely in MongoDB.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link
              to={user ? '/interview/setup' : '/register'}
              className="btn btn-primary btn-lg"
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Student Callout */}
      <section style={{ backgroundColor: '#050811', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '4.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em', color: '#ffffff' }}>
            Built With College Tech Stacks You Understand
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2.2rem' }}>
            Developed using HTML5, CSS3, modern JavaScript, React, Node.js, Express,
            and MongoDB Atlas. Clean, accessible code with zero unnecessary overhead.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 600 }}>React.js Hooks</span>
            <span style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 600 }}>Node + Express REST</span>
            <span style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 600 }}>MongoDB & Mongoose</span>
            <span style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#67e8f9', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 600 }}>SpeechRecognition API</span>
            <span style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#d8b4fe', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 600 }}>JWT & Bcrypt Security</span>
          </div>
        </div>
      </section>
    </div>
  );
}
