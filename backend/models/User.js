import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getFallbackData, saveFallbackData, getDBStatus } from '../config/db.js';

// 1. Mongoose Schema for MongoDB
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    targetRole: {
      type: String,
      default: 'Software Developer',
    },
    experienceLevel: {
      type: String,
      enum: ['Fresher', 'Intermediate', 'Experienced'],
      default: 'Fresher',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: ['JavaScript', 'React', 'Node.js'],
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password on mongoose doc
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

let MongooseUser;
try {
  MongooseUser = mongoose.model('User', userSchema);
} catch (e) {
  MongooseUser = mongoose.models.User;
}

// 2. Universal User Model Adapter
// Works with real MongoDB if connected, or smoothly with embedded store
export const User = {
  async findOne(query) {
    if (getDBStatus().isConnected && MongooseUser) {
      return await MongooseUser.findOne(query);
    }
    const data = getFallbackData();
    let found = null;
    if (query.email) {
      found = data.users.find(
        (u) => u.email.toLowerCase() === query.email.toLowerCase()
      );
    } else if (query._id) {
      found = data.users.find((u) => u._id === query._id || u.id === query._id);
    }
    if (!found) return null;

    // Attach helper methods
    return {
      ...found,
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, found.password);
      },
    };
  },

  async findById(id) {
    if (getDBStatus().isConnected && MongooseUser) {
      return await MongooseUser.findById(id).select('-password');
    }
    const data = getFallbackData();
    const found = data.users.find((u) => u._id === id || u.id === id);
    if (!found) return null;
    const { password, ...userWithoutPassword } = found;
    return {
      ...userWithoutPassword,
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, password);
      },
    };
  },

  async create(userData) {
    // Hash password if not hashed yet
    let hashedPassword = userData.password;
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    if (getDBStatus().isConnected && MongooseUser) {
      return await MongooseUser.create({
        ...userData,
        password: hashedPassword,
      });
    }

    const data = getFallbackData();
    const existing = data.users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      const err = new Error('User with this email already exists');
      err.code = 11000;
      throw err;
    }

    const newUser = {
      _id: crypto.randomUUID(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      targetRole: userData.targetRole || 'Software Developer',
      experienceLevel: userData.experienceLevel || 'Fresher',
      bio: userData.bio || '',
      skills: userData.skills || ['JavaScript', 'React', 'Node.js'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    saveFallbackData(data);

    return {
      ...newUser,
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, newUser.password);
      },
    };
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (getDBStatus().isConnected && MongooseUser) {
      return await MongooseUser.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        ...options,
      }).select('-password');
    }

    const data = getFallbackData();
    const index = data.users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;

    data.users[index] = {
      ...data.users[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    saveFallbackData(data);

    const { password, ...updatedUser } = data.users[index];
    return updatedUser;
  },

  async countDocuments(query = {}) {
    if (getDBStatus().isConnected && MongooseUser) {
      return await MongooseUser.countDocuments(query);
    }
    const data = getFallbackData();
    return data.users.length;
  },
};

export default User;
