import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <Sparkles size={20} color="#38bdf8" />
            <h3 style={{ margin: 0 }}>InterviewAI</h3>
          </div>
          <p>
            An intelligent AI mock interview & evaluation platform crafted for college students,
            freshers, and aspiring software engineers preparing for competitive campus placements and technical interviews.
          </p>
        </div>

        <div className="footer-col">
          <h4>Preparation Tracks</h4>
          <ul className="footer-links">
            <li><a href="#features">Frontend (React, JavaScript, CSS)</a></li>
            <li><a href="#features">Backend (Node.js, Express, MongoDB)</a></li>
            <li><a href="#features">Core Java & OOPs Design</a></li>
            <li><a href="#features">Data Analyst & SQL</a></li>
            <li><a href="#features">HR & Behavioral Rounds</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Core Tech Stack</h4>
          <ul className="footer-links">
            <li><span>Frontend: HTML5, CSS3, JavaScript, React</span></li>
            <li><span>Backend: Node.js, Express.js</span></li>
            <li><span>Database: MongoDB Atlas & Mongoose</span></li>
            <li><span>AI Engine: Google Gemini API</span></li>
            <li><span>Security: JWT & bcryptjs</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} InterviewAI. Built for college placement excellence and career success.
        </p>
      </div>
    </footer>
  );
}
