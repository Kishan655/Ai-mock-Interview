import User from '../models/User.js';
import Interview from '../models/Interview.js';

// @desc    Get user profile and interview summary
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const interviews = await Interview.find({ userId });
    const completed = interviews.filter((i) => i.status === 'completed');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completed.length)
      : 0;

    res.status(200).json({
      success: true,
      profile: {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole || 'Software Developer',
        experienceLevel: user.experienceLevel || 'Fresher',
        bio: user.bio || '',
        skills: user.skills || [],
        createdAt: user.createdAt,
        stats: {
          totalInterviews: interviews.length,
          completedInterviews: completed.length,
          averageScore: avgScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update candidate profile details
// @route   PATCH /api/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, targetRole, experienceLevel, bio, skills } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (targetRole) updateFields.targetRole = targetRole;
    if (experienceLevel) updateFields.experienceLevel = experienceLevel;
    if (typeof bio === 'string') updateFields.bio = bio;
    if (Array.isArray(skills)) updateFields.skills = skills;

    const updated = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updated,
    });
  } catch (error) {
    next(error);
  }
};
