const mongoose = require('mongoose');

const MeetingRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  student_id: {
    type: String,
    required: true,
    index: true
  },
  student_name: {
    type: String,
    default: 'Student'
  },
  college_id: {
    type: String,
    default: 'C101',
    index: true
  },
  category: {
    type: String,
    enum: ['meeting', 'academic', 'crisis'],
    default: 'meeting',
    index: true
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal',
    index: true
  },
  reason_short: {
    type: String,
    required: true,
    maxlength: 200
  },
  delivery_status: {
    type: String,
    enum: ['pending', 'delivered', 'failed'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  next_retry_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  delivered_at: {
    type: Date,
    default: null
  },
  last_error: {
    type: String,
    default: null
  },
  mentor_name: {
    type: String,
    default: null
  },
  caller_auth_type: {
    type: String,
    enum: ['api-key', 'session-token', 'anonymous'],
    default: 'anonymous'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MeetingRequest', MeetingRequestSchema, 'ai_meeting_outbox');
