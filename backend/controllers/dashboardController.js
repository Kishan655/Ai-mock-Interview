import Interview from '../models/Interview.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics for authenticated user
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // Fetch all user's interviews
    const allInterviews = await Interview.find({ userId });
    const completedInterviews = allInterviews.filter((i) => i.status === 'completed');

    // Calculate total completed
    const totalCompleted = completedInterviews.length;

    // Calculate average overall score
    const totalScore = completedInterviews.reduce(
      (sum, i) => sum + (i.overallScore || 0),
      0
    );
    const averageScore = totalCompleted > 0 ? Math.round(totalScore / totalCompleted) : 0;

    // Calculate average category scores
    let catTotals = {
      technicalKnowledge: 0,
      communication: 0,
      problemSolving: 0,
      answerRelevance: 0,
    };

    completedInterviews.forEach((i) => {
      if (i.categoryScores) {
        catTotals.technicalKnowledge += i.categoryScores.technicalKnowledge || 0;
        catTotals.communication += i.categoryScores.communication || 0;
        catTotals.problemSolving += i.categoryScores.problemSolving || 0;
        catTotals.answerRelevance += i.categoryScores.answerRelevance || 0;
      }
    });

    const categoryAverages = {
      technicalKnowledge: totalCompleted > 0 ? Math.round(catTotals.technicalKnowledge / totalCompleted) : 0,
      communication: totalCompleted > 0 ? Math.round(catTotals.communication / totalCompleted) : 0,
      problemSolving: totalCompleted > 0 ? Math.round(catTotals.problemSolving / totalCompleted) : 0,
      answerRelevance: totalCompleted > 0 ? Math.round(catTotals.answerRelevance / totalCompleted) : 0,
    };

    // Total questions answered across all interviews
    let totalQuestionsAnswered = 0;
    allInterviews.forEach((i) => {
      const answered = (i.questions || []).filter((q) => q.candidateAnswer && q.candidateAnswer.trim());
      totalQuestionsAnswered += answered.length;
    });

    // Readiness status
    let readiness = 'Not Started';
    if (totalCompleted > 0) {
      if (averageScore >= 80) readiness = 'Placement Ready';
      else if (averageScore >= 65) readiness = 'Interview Ready';
      else readiness = 'Needs Practice';
    }

    // Recent 5 interviews
    const recentInterviews = allInterviews.slice(0, 5).map((i) => ({
      _id: i._id || i.id,
      jobRole: i.jobRole,
      experienceLevel: i.experienceLevel,
      interviewType: i.interviewType,
      difficulty: i.difficulty,
      status: i.status,
      overallScore: i.overallScore,
      totalQuestions: i.totalQuestions,
      createdAt: i.createdAt,
      completedAt: i.completedAt,
    }));

    // Collect recent recommendations
    const allRecommendations = [];
    completedInterviews.slice(0, 3).forEach((i) => {
      if (Array.isArray(i.recommendedTopics)) {
        allRecommendations.push(...i.recommendedTopics);
      }
    });
    const uniqueTopics = [...new Set(allRecommendations)].slice(0, 6);

    // Score trend for performance chart (chronological order)
    const scoreTrend = completedInterviews
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((i, index) => ({
        interviewId: i._id || i.id,
        session: `#${index + 1}`,
        sessionNumber: index + 1,
        date: new Date(i.completedAt || i.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: new Date(i.completedAt || i.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        role: i.jobRole || 'General',
        difficulty: i.difficulty || 'Medium',
        overallScore: i.overallScore || 0,
        technicalKnowledge: i.categoryScores?.technicalKnowledge || 0,
        communication: i.categoryScores?.communication || 0,
        problemSolving: i.categoryScores?.problemSolving || 0,
        answerRelevance: i.categoryScores?.answerRelevance || 0,
      }));

    res.status(200).json({
      success: true,
      stats: {
        totalInterviewsCompleted: totalCompleted,
        totalInterviewsInProgress: allInterviews.filter((i) => i.status === 'in-progress').length,
        averageScore,
        readiness,
        totalQuestionsAnswered,
        categoryAverages,
        recentInterviews,
        scoreTrend,
        recommendedTopics: uniqueTopics,
      },
    });
  } catch (error) {
    next(error);
  }
};
