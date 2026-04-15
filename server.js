require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

const Chapter = require('./models/Chapter');
const Lecture = require('./models/Lecture');
const LiveSchedule = require('./models/LiveSchedule');
const Score = require('./models/Score');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Error:', err));

// ADMIN AUTH
const ADMIN_TOKEN = "pw-admin-token-2026";

app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  const HASHED = "$2b$10$s9tJV4g7WmO34G5MJV1vnegyMfg0q2WJ8vm4vpL3ABJ1PoRInMVrq"; // admin123

  const isMatch = await bcrypt.compare(password, HASHED);
  if (isMatch) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ success: false, message: "Wrong Password" });
});

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === `Bearer ${ADMIN_TOKEN}`) return next();
  res.status(401).json({ success: false, message: "Unauthorized" });
};

// ====================== CHAPTERS ======================
app.get('/api/chapters', async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ error: "subjectId is required" });

    const chapters = await Chapter.find({ subjectId }).sort({ order: 1, createdAt: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chapters', authenticateAdmin, async (req, res) => {
  try {
    const chapter = new Chapter(req.body);
    await chapter.save();
    res.json({ success: true, chapter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chapters/:id', authenticateAdmin, async (req, res) => {
  try {
    await Lecture.deleteMany({ chapterId: req.params.id });
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================== LECTURES ======================
app.get('/api/lectures', async (req, res) => {
  try {
    const { subjectId, chapterId } = req.query;
    let query = {};
    if (subjectId) query.subjectId = subjectId;
    if (chapterId) query.chapterId = chapterId;

    const lectures = await Lecture.find(query).sort({ createdAt: 1 });
    res.json(lectures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lectures', authenticateAdmin, async (req, res) => {
  try {
    const lecture = new Lecture(req.body);
    await lecture.save();
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/lectures/:id', authenticateAdmin, async (req, res) => {
  try {
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================== MARK LECTURE AS COMPLETED ======================
app.patch('/api/lectures/:id/complete', authenticateAdmin, async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================== UPDATE LECTURE (NEW) ======================
app.put('/api/lectures/:id', authenticateAdmin, async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
