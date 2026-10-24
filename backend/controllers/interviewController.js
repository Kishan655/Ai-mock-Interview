import Interview from '../models/Interview.js';
import {
  generateInterviewQuestions,
  evaluateCandidateAnswer,
  generateFollowUpQuestion,
  generateFinalEvaluation,
  getCuratedQuestions,
} from '../services/geminiService.js';

// @desc    Create a new interview session and generate AI questions
// @route   POST /api/interviews
// @access  Private
export const createInterview = async (req, res, next) => {
  try {
    const {
      jobRole = 'Software Developer',
      experienceLevel = 'Fresher',
      interviewType = 'Mixed',
      difficulty = 'Medium',
      skills = [],
      totalQuestions = 5,
    } = req.body;

    const parsedTotal = Math.min(15, Math.max(3, Number(totalQuestions) || 5));
    const safeSkills = Array.isArray(skills) ? skills : (skills ? [skills] : []);

    // Generate questions using Gemini AI service with fallback safety
    let generatedQuestions = [];
    try {
      generatedQuestions = await generateInterviewQuestions({
        jobRole,
        experienceLevel,
        interviewType,
        difficulty,
        skills: safeSkills,
        totalQuestions: parsedTotal,
      });
    } catch (genErr) {
      console.warn('generateInterviewQuestions error in controller, falling back:', genErr.message);
      generatedQuestions = getCuratedQuestions(jobRole, experienceLevel, interviewType, parsedTotal, safeSkills);
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      generatedQuestions = getCuratedQuestions(jobRole, experienceLevel, interviewType, parsedTotal, safeSkills);
    }

    const interview = await Interview.create({
      userId: req.user._id || req.user.id,
      jobRole,
      experienceLevel,
      interviewType,
      difficulty,
      skills: safeSkills,
      totalQuestions: generatedQuestions.length,
      currentQuestionIndex: 0,
      status: 'in-progress',
      questions: generatedQuestions,
      overallScore: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Interview session created successfully.',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interviews for current logged in user
// @route   GET /api/interviews
// @access  Private
export const getInterviews = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const interviews = await Interview.find({ userId });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview details and evaluation report
// @route   GET /api/interviews/:id
// @access  Private
export const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found.',
      });
    }

    // Verify ownership
    const currentUserId = String(req.user._id || req.user.id);
    const interviewOwnerId = String(interview.userId);

    if (currentUserId !== interviewOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access another candidate’s interview.',
      });
    }

    // Self-healing: if an interview session has 0 questions, populate them
    if (!interview.questions || interview.questions.length === 0) {
      interview.questions = getCuratedQuestions(
        interview.jobRole || 'Software Developer',
        interview.experienceLevel || 'Fresher',
        interview.interviewType || 'Mixed',
        interview.totalQuestions || 5,
        interview.skills || []
      );
      interview.totalQuestions = interview.questions.length;
      await Interview.findByIdAndUpdate(interview._id || interview.id, interview);
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve next question in sequence
// @route   POST /api/interviews/:id/next-question
// @access  Private
export const getNextQuestion = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found.',
      });
    }

    if (String(interview.userId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const index = interview.currentQuestionIndex;
    const currentQuestion = interview.questions[index];

    if (!currentQuestion) {
      return res.status(200).json({
        success: true,
        isCompleted: true,
        message: 'All questions have been completed.',
      });
    }

    res.status(200).json({
      success: true,
      isCompleted: false,
      questionIndex: index,
      totalQuestions: interview.questions.length,
      question: {
        questionText: currentQuestion.questionText,
        questionType: currentQuestion.questionType,
        index,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer for current question and evaluate with Gemini
// @route   POST /api/interviews/:id/answers
// @access  Private
export const submitAnswer = async (req, res, next) => {
  try {
    const { candidateAnswer = '', timeSpentSeconds = 0, skip = false } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found.',
      });
    }

    if (String(interview.userId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This interview has already been completed.',
      });
    }

    const currentIndex = interview.currentQuestionIndex;
    if (currentIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'All questions have already been answered.',
      });
    }

    const currentQ = interview.questions[currentIndex];

    // Prevent accidental duplicate submissions
    if (currentQ.answeredAt && currentQ.candidateAnswer) {
      return res.status(400).json({
        success: false,
        message: 'An answer for this question was already submitted.',
      });
    }

    // Evaluate answer with Gemini AI
    let evaluation;
    let followUpAdded = false;

    if (skip || !candidateAnswer.trim()) {
      evaluation = {
        score: 0,
        feedback: 'Question was skipped by candidate. Review this topic to build confidence.',
        suggestedAnswer: currentQ.suggestedAnswer || 'Formulate answers clearly by stating definitions and practical use-cases.',
      };
    } else {
      const followUpPromise =
        candidateAnswer.trim().length > 40 && interview.questions.length < 8
          ? generateFollowUpQuestion({
              jobRole: interview.jobRole,
              experienceLevel: interview.experienceLevel,
              previousQuestion: currentQ.questionText,
              candidateAnswer,
            }).catch(() => null)
          : Promise.resolve(null);

      const [evalResult, followUpText] = await Promise.all([
        evaluateCandidateAnswer({
          jobRole: interview.jobRole,
          experienceLevel: interview.experienceLevel,
          questionText: currentQ.questionText,
          candidateAnswer,
        }),
        followUpPromise,
      ]);

      evaluation = evalResult;

      if (followUpText) {
        interview.questions.push({
          questionText: `Follow-up: ${followUpText}`,
          questionType: currentQ.questionType || 'Technical',
          candidateAnswer: '',
          score: 0,
          feedback: '',
          suggestedAnswer: '',
          timeSpentSeconds: 0,
        });
        interview.totalQuestions = interview.questions.length;
        followUpAdded = true;
      }
    }

    // Update question
    currentQ.candidateAnswer = candidateAnswer;
    currentQ.score = evaluation.score;
    currentQ.feedback = evaluation.feedback;
    currentQ.suggestedAnswer = evaluation.suggestedAnswer;
    currentQ.timeSpentSeconds = Number(timeSpentSeconds) || 0;
    currentQ.answeredAt = new Date();

    // Advance index
    interview.currentQuestionIndex = currentIndex + 1;

    const updatedInterview = await Interview.findByIdAndUpdate(
      interview._id || interview.id,
      interview
    );

    const isFinished = interview.currentQuestionIndex >= interview.questions.length;

    res.status(200).json({
      success: true,
      evaluation,
      followUpAdded,
      currentIndex: interview.currentQuestionIndex,
      totalQuestions: interview.questions.length,
      isFinished,
      interview: updatedInterview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finish interview and generate final AI comprehensive evaluation
// @route   POST /api/interviews/:id/finish
// @access  Private
export const finishInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found.',
      });
    }

    if (String(interview.userId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    // Call Gemini final evaluation service
    const finalReport = await generateFinalEvaluation({
      jobRole: interview.jobRole,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty,
      questionsWithAnswers: interview.questions,
    });

    interview.status = 'completed';
    interview.overallScore = finalReport.overallScore;
    interview.categoryScores = finalReport.categoryScores;
    interview.strengths = finalReport.strengths;
    interview.weaknesses = finalReport.weaknesses;
    interview.improvementPlan = finalReport.improvementPlan;
    interview.recommendedTopics = finalReport.recommendedTopics;
    interview.completedAt = new Date();

    const saved = await Interview.findByIdAndUpdate(
      interview._id || interview.id,
      interview
    );

    res.status(200).json({
      success: true,
      message: 'Interview completed and evaluated successfully.',
      report: finalReport,
      interview: saved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an interview session
// @route   DELETE /api/interviews/:id
// @access  Private
export const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found.',
      });
    }

    if (String(interview.userId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own interviews.',
      });
    }

    await Interview.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
