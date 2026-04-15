const mongoose = require('mongoose');

const liveScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  subject: String,
  link: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model('LiveSchedule', liveScheduleSchema);
