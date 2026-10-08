const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const mlServiceClient = {
  predictStudent: async (payload) => {
    try {
      const res = await client.post('/predict', payload);
      return res.data;
    } catch (err) {
      console.error('[ML Microservice] Predict call failed:', err.message);
      throw new Error(`ML Microservice Inference Failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  sendChat: async (message, studentContext = {}) => {
    try {
      const res = await client.post('/chat', {
        message,
        student_context: studentContext
      });
      return res.data;
    } catch (err) {
      console.error('[ML Microservice] Chat call failed:', err.message);
      throw new Error(`ML Microservice Chat Failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  getMetrics: async () => {
    try {
      const res = await client.get('/metrics');
      return res.data;
    } catch (err) {
      console.error('[ML Microservice] Metrics call failed:', err.message);
      throw new Error(`ML Microservice Metrics Failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  checkHealth: async () => {
    try {
      const res = await client.get('/health');
      return res.data;
    } catch (err) {
      return { status: 'offline', error: err.message };
    }
  }
};

module.exports = mlServiceClient;
