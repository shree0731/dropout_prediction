const mongoose = require('mongoose');

const MeetingRequestSchema = new mongoose.Schema({
  student_id: { type: String, required: true, index: true },
  student_name: { type: String, default: 'Student' },
  requested_with: { type: String, enum: ['mentor', 'counselor'], default: 'mentor' },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed'], default: 'pending' },
  notes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('MeetingRequest', MeetingRequestSchema);
