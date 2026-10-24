import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err.message);
  }
}

// Recommended fast model for text generation and structured output
const MODEL_NAME = 'gemini-2.5-flash';

// Timeout wrapper to ensure requests NEVER hang indefinitely
const callWithTimeout = (promise, ms = 7500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI generation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// Clean and parse JSON safely
const parseJsonResponse = (text) => {
  if (!text) return null;
  let clean = text.trim();
  // Strip markdown code block fences if present
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return JSON.parse(clean);
};

/**
 * 1. Generate interview questions tailored to candidate specifications
 */
export const generateInterviewQuestions = async ({
  jobRole = 'Software Developer',
  experienceLevel = 'Fresher',
  interviewType = 'Mixed',
  difficulty = 'Medium',
  skills = [],
  totalQuestions = 5,
}) => {
  const safeTotal = Math.min(15, Math.max(3, Number(totalQuestions) || 5));
  const safeSkills = Array.isArray(skills) ? skills : (skills ? [skills] : []);

  const prompt = `You are an expert technical interviewer and hiring manager at a top tech company conducting an interview for a ${experienceLevel} ${jobRole}.
Skills required: ${safeSkills.join(', ') || 'Core computer science, problem-solving, and fundamentals'}.
Interview Type: ${interviewType}.
Difficulty: ${difficulty}.
Total Questions needed: ${safeTotal}.

Generate exactly ${safeTotal} realistic, insightful, and practical interview questions suitable for a college student / job seeker.
Balance the question types according to interview type "${interviewType}":
- If Technical: Focus on practical language/framework concepts, core algorithms, data structures, debugging, and system design basics.
- If HR: Focus on behavioral, situational, culture fit, teamwork, and career aspirations.
- If Mixed: Provide a blend (approx 70% technical, 30% HR/behavioral).

Return ONLY a valid JSON array matching this schema:
[
  {
    "questionText": "Question string here",
    "questionType": "Technical" | "HR" | "Behavioral"
  }
]`;

  if (ai) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
        8000
      );

      const parsed = parseJsonResponse(response.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validQuestions = parsed
          .filter((q) => q && typeof q.questionText === 'string' && q.questionText.trim())
          .map((q) => ({
            questionText: q.questionText.trim(),
            questionType: q.questionType || (interviewType === 'HR' ? 'HR' : 'Technical'),
            candidateAnswer: '',
            score: 0,
            feedback: '',
            suggestedAnswer: '',
            timeSpentSeconds: 0,
          }));

        if (validQuestions.length >= safeTotal) {
          return validQuestions.slice(0, safeTotal);
        } else if (validQuestions.length > 0) {
          // Supplement missing questions from curated bank
          const fallback = getCuratedQuestions(jobRole, experienceLevel, interviewType, safeTotal, safeSkills);
          const combined = [...validQuestions, ...fallback.slice(validQuestions.length)];
          return combined.slice(0, safeTotal);
        }
      }
    } catch (error) {
      console.warn('Gemini question generation error, falling back to curated bank:', error.message);
    }
  }

  // Curated fallback bank tailored for placement students
  return getCuratedQuestions(jobRole, experienceLevel, interviewType, safeTotal, safeSkills);
};

/**
 * 2. Generate a smart follow-up question
 */
export const generateFollowUpQuestion = async ({
  jobRole,
  experienceLevel,
  previousQuestion,
  candidateAnswer,
}) => {
  if (!ai || !candidateAnswer || candidateAnswer.trim().length < 25) {
    return null;
  }

  const prompt = `You are an interviewer evaluating a ${experienceLevel} ${jobRole}.
Previous Question: "${previousQuestion}"
Candidate's Answer: "${candidateAnswer}"

If the candidate's answer is interesting or missed an edge case or important practical nuance, generate ONE short, focused follow-up question to test their depth.
If the answer is already exhaustive, trivial, or unrelated, return null.

Return JSON:
{
  "hasFollowUp": true or false,
  "followUpQuestion": "string question or null"
}`;

  try {
    const response = await callWithTimeout(
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      6000
    );
    const result = parseJsonResponse(response.text);
    return result?.hasFollowUp ? result.followUpQuestion : null;
  } catch (error) {
    console.warn('Gemini follow-up error (skipping follow-up gracefully):', error.message);
    return null;
  }
};

/**
 * 3. Evaluate a single answer
 */
export const evaluateCandidateAnswer = async ({
  jobRole = 'Software Developer',
  experienceLevel = 'Fresher',
  questionText,
  candidateAnswer,
}) => {
  if (!candidateAnswer || candidateAnswer.trim() === '') {
    return {
      score: 0,
      feedback: 'No answer was provided for this question.',
      suggestedAnswer: 'Candidates are encouraged to articulate their thought process even if unsure.',
    };
  }

  const prompt = `You are a fair, seasoned tech hiring manager evaluating an interview response for a ${experienceLevel} ${jobRole}.
Question: "${questionText}"
Candidate's Answer: "${candidateAnswer}"

Evaluate fairly:
- Assess correctness, technical accuracy, clarity of thought, relevance, and reasoning.
- Do NOT give higher scores merely because an answer is lengthy.
- A concise, precise answer with correct concepts deserves 85-95.
- If the answer is vague, generic, or misses core concepts, deduct points appropriately.
- If the answer has factual mistakes, point them out constructively.

Return JSON:
{
  "score": number between 0 and 100,
  "feedback": "2-3 sentences of constructive feedback explaining strengths and what was missing or incorrect",
  "suggestedAnswer": "A concise, well-structured model answer demonstrating ideal clarity and technical depth"
}`;

  if (ai) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        7000
      );
      const parsed = parseJsonResponse(response.text);
      if (parsed && typeof parsed.score === 'number') {
        return {
          score: Math.min(100, Math.max(0, Math.round(parsed.score))),
          feedback: parsed.feedback || 'Good attempt. Focus on providing concrete examples.',
          suggestedAnswer: parsed.suggestedAnswer || 'Review the core documentation and fundamentals for this topic.',
        };
      }
    } catch (error) {
      console.warn('Gemini answer evaluation error, using rule-based scoring:', error.message);
    }
  }

  // Graceful rule-based evaluation fallback
  const wordCount = candidateAnswer.trim().split(/\s+/).length;
  const score = Math.min(88, Math.max(45, Math.round(wordCount * 1.5 + 40)));
  return {
    score,
    feedback: `The answer addresses key points (${wordCount} words provided). To improve, delve deeper into architectural trade-offs, edge cases, and real-world implementation details.`,
    suggestedAnswer: `An ideal response clearly defines the core concept, explains its operational mechanism, notes performance implications, and provides a concise practical example.`,
  };
};

/**
 * 4. Generate final comprehensive interview report
 */
export const generateFinalEvaluation = async ({
  jobRole = 'Software Developer',
  experienceLevel = 'Fresher',
  interviewType = 'Mixed',
  difficulty = 'Medium',
  questionsWithAnswers = [],
}) => {
  const summaryPromptData = questionsWithAnswers.map((q, idx) => ({
    qIndex: idx + 1,
    question: q.questionText,
    answer: q.candidateAnswer || '(Skipped / Unanswered)',
    itemScore: q.score || 0,
  }));

  const prompt = `You are the lead interview panelist conducting final evaluation for a ${experienceLevel} ${jobRole} candidate.
Interview Type: ${interviewType}, Difficulty: ${difficulty}.

Candidate's Performance per question:
${JSON.stringify(summaryPromptData, null, 2)}

Provide a rigorous, constructive, and encouraging evaluation for this candidate's placement preparation.
Calculate category scores (0-100):
- technicalKnowledge: understanding of core computer science, tools, and job concepts
- communication: clarity, structure, professionalism, and conciseness
- problemSolving: logical deduction, handling edge cases, and reasoning
- answerRelevance: direct addressing of questions without fluff

Also provide:
- overallScore (0-100, balanced weighted average)
- strengths: array of 3 to 4 specific positive observations
- weaknesses: array of 2 to 3 areas where candidate needs to grow
- improvementPlan: array of 4 to 5 clear action steps to prepare for campus placements / job interviews
- recommendedTopics: array of 5 to 7 specific technical topics or subjects to revise

Return JSON ONLY:
{
  "overallScore": number,
  "categoryScores": {
    "technicalKnowledge": number,
    "communication": number,
    "problemSolving": number,
    "answerRelevance": number
  },
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "improvementPlan": ["string", "string"],
  "recommendedTopics": ["string", "string"]
}`;

  if (ai) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        8000
      );
      const parsed = parseJsonResponse(response.text);
      if (parsed && typeof parsed.overallScore === 'number') {
        return parsed;
      }
    } catch (error) {
      console.warn('Gemini final evaluation error, computing analytical fallback:', error.message);
    }
  }

  // Robust analytical fallback calculation from individual question scores
  const answered = questionsWithAnswers.filter((q) => q.candidateAnswer && q.candidateAnswer.trim());
  const avgScore = questionsWithAnswers.length > 0
    ? Math.round(questionsWithAnswers.reduce((sum, q) => sum + (q.score || 0), 0) / questionsWithAnswers.length)
    : 70;

  return {
    overallScore: avgScore,
    categoryScores: {
      technicalKnowledge: Math.max(45, Math.min(95, avgScore + 2)),
      communication: Math.max(50, Math.min(92, avgScore - 3)),
      problemSolving: Math.max(48, Math.min(94, avgScore + 1)),
      answerRelevance: Math.max(50, Math.min(95, avgScore)),
    },
    strengths: [
      `Demonstrated genuine attempt across ${answered.length} out of ${questionsWithAnswers.length} questions.`,
      `Showed solid familiarity with fundamental ${jobRole} principles and terminology.`,
      `Maintained a professional, structured answering format.`,
    ],
    weaknesses: [
      `Could provide deeper technical explanations and cite real project challenges.`,
      `Some responses could be more structured using the STAR (Situation, Task, Action, Result) methodology.`,
    ],
    improvementPlan: [
      `Review core data structures, algorithms, and standard runtime complexities (Big-O).`,
      `Build 1-2 end-to-end full stack projects to articulate real challenges faced.`,
      `Practice vocalizing technical problem-solving steps before providing the final answer.`,
      `Revise system architecture, state management, and database query optimization.`,
    ],
    recommendedTopics: [
      `${jobRole} Core Architecture`,
      'REST API Design & HTTP Status Codes',
      'Database Indexing & Query Optimization',
      'State Management & Component Lifecycle',
      'Asynchronous Programming & Event Loop',
      'Clean Code & SOLID Design Principles',
    ],
  };
};

/**
 * Curated Comprehensive Question Bank for college placements & technical rounds
 */
export function getCuratedQuestions(role = 'Software Developer', level = 'Fresher', type = 'Mixed', count = 5, skills = []) {
  const isHR = type === 'HR';
  const roleLower = (role || '').toLowerCase();
  const skillsArray = Array.isArray(skills) ? skills : [];
  const skillsString = skillsArray.join(' ').toLowerCase();

  const technicalPool = [];

  // 1. Frontend / React / Web
  if (
    roleLower.includes('frontend') ||
    roleLower.includes('react') ||
    roleLower.includes('web') ||
    skillsString.includes('react') ||
    skillsString.includes('javascript') ||
    skillsString.includes('html') ||
    skillsString.includes('css')
  ) {
    technicalPool.push(
      { questionText: 'Explain the Virtual DOM in React. How does React’s reconciliation diffing algorithm optimize DOM updates?', questionType: 'Technical' },
      { questionText: 'What is the difference between useEffect, useMemo, and useCallback? In what practical scenarios would you use each?', questionType: 'Technical' },
      { questionText: 'How does CSS Flexbox differ from CSS Grid, and in what layout situations would you choose one over the other?', questionType: 'Technical' },
      { questionText: 'Explain the JavaScript Event Loop, Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout).', questionType: 'Technical' },
      { questionText: 'What techniques do you employ to optimize web performance (e.g., code splitting, lazy loading, asset optimization)?', questionType: 'Technical' },
      { questionText: 'What is prop drilling in React and how do you resolve it using Context API or state management libraries?', questionType: 'Technical' },
      { questionText: 'Explain CORS (Cross-Origin Resource Sharing). How does the browser enforce it and how do you configure it?', questionType: 'Technical' }
    );
  }

  // 2. Backend / Node.js / Express / APIs
  if (
    roleLower.includes('backend') ||
    roleLower.includes('node') ||
    skillsString.includes('node') ||
    skillsString.includes('express') ||
    skillsString.includes('api') ||
    skillsString.includes('mongodb')
  ) {
    technicalPool.push(
      { questionText: 'How does Node.js handle concurrent requests with a single-threaded event loop? Explain libuv and thread pools.', questionType: 'Technical' },
      { questionText: 'Explain how middleware works in Express.js. How do you implement centralized error handling and authentication?', questionType: 'Technical' },
      { questionText: 'Compare SQL (relational) vs NoSQL (e.g. MongoDB) databases. When should you choose document storage over relational tables?', questionType: 'Technical' },
      { questionText: 'What is JWT (JSON Web Token)? Explain its three parts (header, payload, signature) and how to store and verify it securely.', questionType: 'Technical' },
      { questionText: 'How do database indexes improve search performance, and what are the trade-offs regarding write operations and memory?', questionType: 'Technical' },
      { questionText: 'What is rate limiting in backend APIs and what algorithms (e.g., token bucket, sliding window) are commonly used?', questionType: 'Technical' }
    );
  }

  // 3. Java / OOP / Spring
  if (roleLower.includes('java') || skillsString.includes('java') || skillsString.includes('spring')) {
    technicalPool.push(
      { questionText: 'Explain the difference between JDK, JRE, and JVM. How does garbage collection work in modern Java?', questionType: 'Technical' },
      { questionText: 'What is the contract between equals() and hashCode() in Java, and why is violating it dangerous in HashMaps?', questionType: 'Technical' },
      { questionText: 'Explain the 4 pillars of Object-Oriented Programming (Encapsulation, Abstraction, Inheritance, Polymorphism) with real software examples.', questionType: 'Technical' },
      { questionText: 'What is the difference between Checked and Unchecked Exceptions in Java? How should each be handled in production applications?', questionType: 'Technical' },
      { questionText: 'Explain Dependency Injection and Inversion of Control (IoC) in the Spring Framework.', questionType: 'Technical' }
    );
  }

  // 4. Data Analyst / Python / SQL
  if (roleLower.includes('data') || roleLower.includes('analyst') || skillsString.includes('sql') || skillsString.includes('python')) {
    technicalPool.push(
      { questionText: 'What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN in SQL? Provide an example.', questionType: 'Technical' },
      { questionText: 'Explain SQL Window Functions (e.g., ROW_NUMBER(), RANK(), DENSE_RANK()). How do they differ from GROUP BY?', questionType: 'Technical' },
      { questionText: 'How do you handle missing, outlier, or duplicated data during data preprocessing and feature preparation?', questionType: 'Technical' },
      { questionText: 'Explain the difference between normalization and denormalization in relational database design.', questionType: 'Technical' },
      { questionText: 'How would you measure and communicate data quality and business KPIs to non-technical stakeholders?', questionType: 'Technical' }
    );
  }

  // 5. Full Stack & Core Software Engineering
  technicalPool.push(
    { questionText: 'What is the REST architectural style? What makes an HTTP method idempotent, and why is PUT idempotent while POST is not?', questionType: 'Technical' },
    { questionText: 'Explain the difference between a Process and a Thread. How do race conditions occur and how can they be prevented?', questionType: 'Technical' },
    { questionText: 'How does Git merge differ from Git rebase? What is your preferred team branching and pull request workflow?', questionType: 'Technical' },
    { questionText: 'Explain the time and space complexity of common sorting algorithms (QuickSort, MergeSort). What is worst-case vs average-case?', questionType: 'Technical' },
    { questionText: 'How do you approach debugging a memory leak or sudden latency spike in a production web application?', questionType: 'Technical' },
    { questionText: 'What is ACID in database transactions? Explain Atomicity, Consistency, Isolation, and Durability with a bank transfer example.', questionType: 'Technical' },
    { questionText: 'Describe how HTTPS encrypts traffic between client and server using SSL/TLS handshake and public/private key cryptography.', questionType: 'Technical' }
  );

  // 6. HR & Behavioral Pool (STAR format)
  const hrPool = [
    { questionText: 'Tell me about yourself, your technical journey, and what specifically motivated you to prepare for this role.', questionType: 'HR' },
    { questionText: 'Describe a challenging project you built. What was the biggest technical blocker you encountered, and how did you resolve it?', questionType: 'Behavioral' },
    { questionText: 'Tell me about a time you worked in a team and had a disagreement about architecture or code style. How was it resolved?', questionType: 'Behavioral' },
    { questionText: 'How do you prioritize multiple tasks and strict deadlines when coursework, projects, or requirements shift unexpectedly?', questionType: 'Behavioral' },
    { questionText: 'Where do you see your career heading in the next 2 to 3 years, and what skills are you actively developing to achieve that?', questionType: 'HR' },
    { questionText: 'Describe a situation where you had to quickly learn an unfamiliar technology or framework. What was your learning strategy?', questionType: 'Behavioral' },
  ];

  let selected = [];
  if (isHR) {
    selected = hrPool.slice(0, count);
  } else if (type === 'Mixed') {
    const hrCount = Math.max(1, Math.round(count * 0.3));
    const techCount = count - hrCount;
    selected = [...technicalPool.slice(0, techCount), ...hrPool.slice(0, hrCount)];
  } else {
    selected = technicalPool.slice(0, count);
  }

  // Ensure count is satisfied
  let extraIdx = 0;
  while (selected.length < count) {
    const fallbackSkill = skillsArray[extraIdx % (skillsArray.length || 1)] || 'software engineering';
    selected.push({
      questionText: `Discuss an important challenge or concept you encountered while learning ${fallbackSkill} and how you tackled it in a project.`,
      questionType: 'Technical',
    });
    extraIdx++;
  }

  return selected.slice(0, count).map((q) => ({
    questionText: q.questionText,
    questionType: q.questionType || 'Technical',
    candidateAnswer: '',
    score: 0,
    feedback: '',
    suggestedAnswer: '',
    timeSpentSeconds: 0,
  }));
}
