const fs = require('fs');
const path = require('path');
const mlServiceClient = require('../services/mlServiceClient');

const LOCAL_METRICS_PATH = path.join(__dirname, '../../models/evaluation/metrics.json');

exports.getMetrics = async (req, res) => {
  try {
    // Attempt live fetch from microservice
    const liveMetrics = await mlServiceClient.getMetrics();
    return res.json({ source: 'fastapi_microservice', ...liveMetrics });
  } catch (err) {
    console.warn('[MetricsController] Microservice offline, falling back to local file:', err.message);
    if (fs.existsSync(LOCAL_METRICS_PATH)) {
      const fileData = JSON.parse(fs.readFileSync(LOCAL_METRICS_PATH, 'utf-8'));
      return res.json({ source: 'local_evaluation_cache', ...fileData });
    }
    return res.status(500).json({ error: 'Metrics file not found and microservice unreachable' });
  }
};
