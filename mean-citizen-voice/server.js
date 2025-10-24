const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_voice';
const PORT = process.env.PORT || 4001;

// Define MongoDB Schemas
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

// Create models
const Feedback = mongoose.model('Feedback', FeedbackSchema);
const Survey = mongoose.model('Survey', SurveySchema);
const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);

// API Routes
// Auth routes
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

// Feedback routes
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

// Survey routes
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

app.get('/api/responses', async (_req, res) => {
  const items = await SurveyResponse.find().sort({ createdAt: -1 }).limit(20).lean();
  res.json(items);
});

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

// Serve Angular app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'angular-client/dist/angular-client')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'angular-client/dist/angular-client/index.html'));
  });
}

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Seed default surveys if none exist
    const surveyCount = await Survey.countDocuments();
    if (surveyCount === 0) {
      await Survey.insertMany([
        { title: 'Public Transport Satisfaction', questions: [ { prompt: 'Rate bus punctuality', type: 'rating' }, { prompt: 'Main issue you face', type: 'text' } ] },
        { title: 'Waste Management Feedback', questions: [ { prompt: 'Your area cleanliness rating', type: 'rating' }, { prompt: 'Suggestions to improve', type: 'text' } ] }
      ]);
      console.log('Seeded default surveys');
    }
    
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();