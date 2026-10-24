import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api.js';
import {
  Clock,
  Send,
  SkipForward,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Trash2,
  Volume2
} from 'lucide-react';

export default function InterviewRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [followUpNotification, setFollowUpNotification] = useState(null);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  // Check browser SpeechRecognition support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const isSpeechSupported = Boolean(SpeechRecognition);

  // Question Timer (120 seconds default per question)
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const timerRef = useRef(null);

  const fetchSessionData = async () => {
    try {
      const res = await interviewAPI.getInterviewById(id);
      if (res && res.interview) {
        const interviewData = res.interview;
        setInterview(interviewData);

        // If interview was already completed, go to results
        if (interviewData.status === 'completed') {
          navigate(`/interview/${id}/results`, { replace: true });
          return;
        }

        const questionsList = Array.isArray(interviewData.questions) ? interviewData.questions : [];
        const idx = interviewData.currentQuestionIndex || 0;
        const total = questionsList.length;
        setCurrentIdx(idx);
        setTotalQ(total);

        if (total === 0) {
          setError('No questions are available in this session. Please start a new interview from setup.');
          return;
        }

        if (idx < total) {
          setCurrentQuestion(questionsList[idx]);
          setSecondsRemaining(120);
        } else {
          // All questions answered, finalize
          handleFinishSession();
        }
      }
    } catch (err) {
      console.error('Failed to load interview room:', err);
      setError(err.message || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  // Countdown Timer Hook
  useEffect(() => {
    if (loading || isSubmitting || !currentQuestion) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, loading, isSubmitting, currentQuestion]);

  // Stop speech recognition when unmounting or changing question
  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, [currentIdx]);

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Start Speech Recognition
  const startDictation = () => {
    if (!isSpeechSupported) {
      setSpeechError('Voice dictation is supported in Chrome, Edge, and Safari. You can still type your answer manually.');
      return;
    }

    setSpeechError('');

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcriptPart;
          } else {
            interimChunk += transcriptPart;
          }
        }

        if (finalChunk.trim()) {
          setAnswerText((prev) => {
            const trimmedPrev = prev ? prev.trim() : '';
            const trimmedChunk = finalChunk.trim();
            return trimmedPrev ? `${trimmedPrev} ${trimmedChunk}` : trimmedChunk;
          });
        }

        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Innocent timeout if user pauses speaking
        } else {
          setSpeechError(`Speech recognition message: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize speech recognition. Please check microphone permissions.');
      setIsListening(false);
    }
  };

  // Stop Speech Recognition
  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore already stopped error
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleDictation = () => {
    if (isListening) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  // Submit Answer handler
  const handleSubmitAnswer = async (skip = false) => {
    stopDictation();

    if (isSubmitting) return;

    if (!skip && !answerText.trim()) {
      setError('Please provide an answer, or click "Skip Question" if you want to pass.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const timeSpent = 120 - secondsRemaining;
      const res = await interviewAPI.submitAnswer(id, {
        candidateAnswer: skip ? '' : answerText.trim(),
        timeSpentSeconds: timeSpent,
        skip,
      });

      if (res && res.success) {
        setAnswerText('');

        if (res.followUpAdded) {
          setFollowUpNotification('Interviewer detected an interesting point and posed a follow-up question!');
          setTimeout(() => setFollowUpNotification(null), 5000);
        }

        if (res.isFinished) {
          // Finalize interview
          await handleFinishSession();
        } else {
          // Advance to next question
          const updatedRes = await interviewAPI.getInterviewById(id);
          const updated = updatedRes.interview;
          setInterview(updated);
          const nextIdx = updated.currentQuestionIndex;
          setCurrentIdx(nextIdx);
          setTotalQ(updated.questions.length);
          setCurrentQuestion(updated.questions[nextIdx]);
          setSecondsRemaining(120);
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      setError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize interview session
  const handleFinishSession = async () => {
    stopDictation();
    setIsSubmitting(true);
    try {
      await interviewAPI.finishInterview(id);
      navigate(`/interview/${id}/results`);
    } catch (err) {
      console.error('Finish interview error:', err);
      setError(err.message || 'Failed to generate final evaluation.');
      setIsSubmitting(false);
    }
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Setting up your interview room...</p>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
            Interview Room Issue
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError('');
                fetchSessionData();
              }}
              className="btn btn-secondary"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate('/interview/setup')}
              className="btn btn-primary"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="interview-room">
        {/* Top Bar with Role, Progress & Timer */}
        <div className="room-topbar">
          <div className="room-meta">
            <div>
              <div style={{ fontSize: '0.78rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>
                {interview?.experienceLevel} Mock Interview
              </div>
              <div className="room-role-title">
                {interview?.jobRole} ({interview?.interviewType})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Timer */}
            <div className={`room-timer ${secondsRemaining < 30 ? 'warning' : ''}`}>
              <Clock size={16} />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* End Session Button */}
            <button
              onClick={() => {
                stopDictation();
                setShowEndModal(true);
              }}
              className="btn btn-outline-white btn-sm"
              title="End interview early"
            >
              <LogOut size={14} />
              <span>End Early</span>
            </button>
          </div>
        </div>

        {/* Follow-up Notification Banner */}
        {followUpNotification && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #93c5fd',
              color: '#1e40af',
              padding: '0.8rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <Sparkles size={18} color="#2563eb" />
            <span>{followUpNotification}</span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="auth-alert-error" style={{ marginBottom: '1.2rem' }}>
            <AlertTriangle size={18} />
            <span>{speechError}</span>
          </div>
        )}

        {error && (
          <div className="auth-alert-error" style={{ marginBottom: '1.2rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Question Box */}
        <div className="question-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="question-index-pill">
              <MessageSquare size={14} />
              <span>Question {currentIdx + 1} of {totalQ}</span>
            </div>

            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Type: {currentQuestion?.questionType || 'Technical'}
            </span>
          </div>

          <h2 className="question-text">
            {currentQuestion?.questionText}
          </h2>

          {/* Progress bar */}
          <div style={{ marginTop: '1.5rem' }}>
            <div className="progress-track" style={{ height: '6px' }}>
              <div
                className="progress-fill blue"
                style={{ width: `${((currentIdx) / totalQ) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Answer Input Box */}
        <div className="answer-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Your Response
              </label>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {wordCount} words
              </span>
            </div>

            {/* Dictation / Speech Recognition Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSpeechSupported ? (
                <button
                  type="button"
                  onClick={toggleDictation}
                  className={`dictate-btn ${isListening ? 'listening' : ''}`}
                  disabled={isSubmitting}
                  title={isListening ? 'Click to stop voice dictation' : 'Click to dictate your answer using microphone'}
                >
                  {isListening ? (
                    <>
                      <MicOff size={16} />
                      <span>Stop Dictating</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span>Dictate Answer (Voice)</span>
                    </>
                  )}
                </button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                  Voice dictation supported in Chrome / Edge / Safari
                </span>
              )}

              {answerText.length > 0 && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => setAnswerText('')}
                  className="btn btn-secondary btn-sm"
                  title="Clear text to re-type or re-dictate"
                  style={{ padding: '0.45rem 0.7rem' }}
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Listening Status Bar */}
          {isListening && (
            <div className="listening-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="recording-dot"></span>
                <span>Listening live... Speak clearly into your microphone.</span>
              </div>
              <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Click "Stop Dictating" when done</span>
            </div>
          )}

          <textarea
            className="answer-textarea"
            placeholder={
              isListening
                ? 'Listening... Speak now and your words will appear here automatically...'
                : 'Type your structured answer here, or click "Dictate Answer (Voice)" above to speak into your microphone...'
            }
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          ></textarea>

          {/* Interim speech transcript preview */}
          {interimTranscript && (
            <div className="interim-transcript-box">
              <strong>Speaking:</strong> "{interimTranscript}"
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.9rem 0 1.2rem' }}>
            💡 <strong>Interview Tip:</strong> Articulate your thought process clearly. State definitions, how mechanisms work, trade-offs, and practical examples.
          </div>

          {/* Action Buttons */}
          <div className="room-actions">
            <button
              type="button"
              onClick={() => handleSubmitAnswer(true)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              <SkipForward size={16} />
              <span>Skip Question</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitAnswer(false)}
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || !answerText.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {currentIdx + 1 === totalQ ? 'Submit & View Report' : 'Submit Answer'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to End Interview Early */}
      {showEndModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">End Interview Early?</h3>
            <p className="modal-desc">
              Are you sure you want to conclude this interview session?
              Unanswered questions will be scored as skipped, and your final placement report will be generated based on submitted answers.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEndModal(false)}
              >
                Continue Interview
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setShowEndModal(false);
                  handleFinishSession();
                }}
              >
                Conclude & View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
