import mongoose from 'mongoose';
import crypto from 'crypto';
import { getFallbackData, saveFallbackData, getDBStatus } from '../config/db.js';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: { type: String, default: 'Technical' },
  candidateAnswer: { type: String, default: '' },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  suggestedAnswer: { type: String, default: '' },
  timeSpentSeconds: { type: Number, default: 0 },
  answeredAt: { type: Date },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['Fresher', 'Intermediate', 'Experienced'],
      default: 'Fresher',
    },
    interviewType: {
      type: String,
      enum: ['Technical', 'HR', 'Behavioral', 'Mixed'],
      default: 'Mixed',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    skills: {
      type: [String],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 5,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    questions: [questionSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    categoryScores: {
      technicalKnowledge: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      answerRelevance: { type: Number, default: 0 },
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    improvementPlan: {
      type: [String],
      default: [],
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

let MongooseInterview;
try {
  MongooseInterview = mongoose.model('Interview', interviewSchema);
} catch (e) {
  MongooseInterview = mongoose.models.Interview;
}

export const Interview = {
  async create(interviewData) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.create(interviewData);
    }

    const data = getFallbackData();
    const newInterview = {
      _id: crypto.randomUUID(),
      userId: interviewData.userId,
      jobRole: interviewData.jobRole,
      experienceLevel: interviewData.experienceLevel || 'Fresher',
      interviewType: interviewData.interviewType || 'Mixed',
      difficulty: interviewData.difficulty || 'Medium',
      skills: interviewData.skills || [],
      totalQuestions: interviewData.totalQuestions || 5,
      currentQuestionIndex: interviewData.currentQuestionIndex || 0,
      status: interviewData.status || 'in-progress',
      questions: interviewData.questions || [],
      overallScore: interviewData.overallScore || 0,
      categoryScores: interviewData.categoryScores || {
        technicalKnowledge: 0,
        communication: 0,
        problemSolving: 0,
        answerRelevance: 0,
      },
      strengths: interviewData.strengths || [],
      weaknesses: interviewData.weaknesses || [],
      improvementPlan: interviewData.improvementPlan || [],
      recommendedTopics: interviewData.recommendedTopics || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };

    data.interviews.push(newInterview);
    saveFallbackData(data);
    return newInterview;
  },

  async find(query = {}) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.find(query).sort({ createdAt: -1 });
    }

    const data = getFallbackData();
    let results = [...data.interviews];

    if (query.userId) {
      results = results.filter((item) => String(item.userId) === String(query.userId));
    }
    if (query.status) {
      results = results.filter((item) => item.status === query.status);
    }

    // Sort descending by createdAt
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results;
  },

  async findById(id) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.findById(id);
    }

    const data = getFallbackData();
    const found = data.interviews.find((item) => item._id === id || item.id === id);
    return found ? { ...found } : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.findByIdAndUpdate(id, updateData, {
        new: true,
        ...options,
      });
    }

    const data = getFallbackData();
    const index = data.interviews.findIndex((item) => item._id === id || item.id === id);
    if (index === -1) return null;

    // Support both direct object updates and nested updates
    data.interviews[index] = {
      ...data.interviews[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    saveFallbackData(data);
    return { ...data.interviews[index] };
  },

  async findByIdAndDelete(id) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.findByIdAndDelete(id);
    }

    const data = getFallbackData();
    const index = data.interviews.findIndex((item) => item._id === id || item.id === id);
    if (index === -1) return null;

    const [deleted] = data.interviews.splice(index, 1);
    saveFallbackData(data);
    return deleted;
  },

  async countDocuments(query = {}) {
    if (getDBStatus().isConnected && MongooseInterview) {
      return await MongooseInterview.countDocuments(query);
    }

    const data = getFallbackData();
    let results = data.interviews;
    if (query.userId) {
      results = results.filter((item) => String(item.userId) === String(query.userId));
    }
    if (query.status) {
      results = results.filter((item) => item.status === query.status);
    }
    return results.length;
  },
};

export default Interview;
