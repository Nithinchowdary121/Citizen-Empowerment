import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the frontend directory in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_voice';
const PORT = process.env.PORT || 4001;

// Schemas
const FeedbackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['services', 'policy', 'infrastructure', 'other'], default: 'other' },
  status: { type: String, enum: ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected'], default: 'submitted' },
  userEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SurveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [{ prompt: String, type: { type: String, enum: ['text', 'rating', 'choice'], default: 'text' }, options: [String] }],
  createdAt: { type: Date, default: Date.now }
});

const SurveyResponseSchema = new mongoose.Schema({
  surveyId: { type: mongoose.Types.ObjectId, ref: 'Survey', required: true },
  answers: [{ questionIndex: Number, answer: mongoose.Schema.Types.Mixed }],
  userEmail: String,
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);
const Survey = mongoose.model('Survey', SurveySchema);
const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);

// API routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Simple demo auth (for lab): admin requires a shared code, citizens log in with email
app.post('/api/auth/login', (req, res) => {
  const { role, email, password } = req.body || {};
  if (!role) return res.status(400).json({ error: 'role is required' });
  if (role === 'admin') {
    const expected = process.env.ADMIN_PASSWORD || 'admin123';
    if (!password || password !== expected) return res.status(401).json({ error: 'Invalid admin credentials' });
    return res.json({ ok: true, role: 'admin' });
  }
  if (role === 'citizen') {
    if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password required (min 4 chars)' });
    return res.json({ ok: true, role: 'citizen', email });
  }
  res.status(400).json({ error: 'role must be admin or citizen' });
});

// Feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const created = await Feedback.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  const { status, category, email } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (email) query.userEmail = email;
  const items = await Feedback.find(query).sort({ createdAt: -1 }).lean();
  res.json(items);
});

// Fetch feedback by comma-separated ids (for client-side "My Suggestions")
app.get('/api/feedback/byIds', async (req, res) => {
  const idsParam = (req.query.ids || '').toString();
  if (!idsParam) return res.json([]);
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  try {
    const items = await Feedback.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/feedback/:id/status', async (req, res) => {
  try {
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Surveys
app.post('/api/surveys', async (req, res) => {
  try {
    const created = await Survey.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/surveys', async (_req, res) => {
  const items = await Survey.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post('/api/surveys/:id/responses', async (req, res) => {
  try {
    const created = await SurveyResponse.create({ surveyId: req.params.id, ...req.body });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List recent responses (for dashboard)
app.get('/api/responses', async (_req, res) => {
  const items = await SurveyResponse.find().sort({ createdAt: -1 }).limit(20).lean();
  res.json(items);
});

// Delete a survey response
app.delete('/api/responses/:id', async (req, res) => {
  try {
    const deleted = await SurveyResponse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reports
app.get('/api/reports/summary', async (_req, res) => {
  const total = await Feedback.countDocuments();
  const byStatus = await Feedback.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const byCategory = await Feedback.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  const surveysCount = await Survey.countDocuments();
  const responsesCount = await SurveyResponse.countDocuments();
  const messagesCount = await Feedback.countDocuments({ description: { $exists: true, $ne: '' } });
  res.json({ total, messagesCount, byStatus, byCategory, surveysCount, responsesCount });
});

// Serve frontend static files (to be added under ../public)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    // Seed default surveys on first run
    const surveyCount = await Survey.countDocuments();
    if (surveyCount === 0) {
      await Survey.insertMany([
        { title: 'Public Transport Satisfaction', questions: [ { prompt: 'Rate bus punctuality', type: 'rating' }, { prompt: 'Main issue you face', type: 'text' } ] },
        { title: 'Waste Management Feedback', questions: [ { prompt: 'Your area cleanliness rating', type: 'rating' }, { prompt: 'Suggestions to improve', type: 'text' } ] },
        { title: 'Water Supply Reliability', questions: [ { prompt: 'Hours of supply per day', type: 'text' }, { prompt: 'Quality rating', type: 'rating' } ] },
        { title: 'Road Safety Survey', questions: [ { prompt: 'Are zebra crossings adequate?', type: 'choice', options: ['Yes','No'] }, { prompt: 'Top hazard location', type: 'text' } ] },
        { title: 'Digital Services Experience', questions: [ { prompt: 'Ease of using city website', type: 'rating' }, { prompt: 'Feature you want next', type: 'text' } ] },
        { title: 'Parks & Recreation', questions: [ { prompt: 'Nearest park condition', type: 'rating' }, { prompt: 'Activities you’d like added', type: 'text' } ] },
        { title: 'Public Health Services', questions: [ { prompt: 'Waiting time at clinics', type: 'text' }, { prompt: 'Staff helpfulness', type: 'rating' } ] }
      ]);
      console.log('Seeded default surveys');
    }
    // Add catch-all route for SPA in production
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
      });
    }
    
    // Optimize for Render free tier - prevent idle timeout
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        console.log('Keeping service alive');
      }, 14 * 60 * 1000); // Ping every 14 minutes to prevent 15-minute idle timeout
    }
    
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();


