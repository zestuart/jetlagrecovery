// ===== SERVER.JS =====
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ōura API proxy endpoints
app.get('/api/oura/personal_info', async (req, res) => {
  try {
    const { authorization } = req.headers;
    
    const response = await axios.get('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Personal info API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status 
    });
  }
});

app.get('/api/oura/sleep/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { authorization } = req.headers;
    
    const response = await axios.get(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${date}&end_date=${date}`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Sleep API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status 
    });
  }
});

app.get('/api/oura/readiness/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { authorization } = req.headers;
    
    const response = await axios.get(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${date}&end_date=${date}`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Readiness API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status 
    });
  }
});

app.get('/api/oura/heartrate/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { authorization } = req.headers;
    
    const response = await axios.get(`https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${date}T00:00:00&end_datetime=${date}T23:59:59`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Heart rate API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status 
    });
  }
});

// Combined endpoint for efficiency
app.get('/api/oura/combined/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { authorization } = req.headers;
    
    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const headers = {
      'Authorization': authorization,
      'Content-Type': 'application/json'
    };

    console.log(`Fetching Ōura data for ${date}...`);

    // Fetch all data types in parallel
    const [sleepResponse, readinessResponse, heartrateResponse] = await Promise.allSettled([
      axios.get(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${date}&end_date=${date}`, { headers }),
      axios.get(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${date}&end_date=${date}`, { headers }),
      axios.get(`https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${date}T00:00:00&end_datetime=${date}T23:59:59`, { headers })
    ]);

    // Extract data from successful responses
    const sleepData = sleepResponse.status === 'fulfilled' ? sleepResponse.value.data : { data: [] };
    const readinessData = readinessResponse.status === 'fulfilled' ? readinessResponse.value.data : { data: [] };
    const heartrateData = heartrateResponse.status === 'fulfilled' ? heartrateResponse.value.data : { data: [] };

    // Process the data
    const sleep = sleepData.data && sleepData.data.length > 0 ? sleepData.data[0] : null;
    const readiness = readinessData.data && readinessData.data.length > 0 ? readinessData.data[0] : null;
    
    // Calculate nighttime resting heart rate
    let avgRestingHr = null;
    if (heartrateData.data && heartrateData.data.length > 0) {
      const nighttimeHR = heartrateData.data.filter(hr => {
        const hour = new Date(hr.timestamp).getHours();
        return hour >= 22 || hour <= 6;
      });
      
      if (nighttimeHR.length > 0) {
        avgRestingHr = nighttimeHR.reduce((sum, hr) => sum + hr.bpm, 0) / nighttimeHR.length;
      }
    }

    const result = {
      date,
      sleep,
      readiness,
      heartrate: {
        bpm: avgRestingHr,
        dataPoints: heartrateData.data ? heartrateData.data.length : 0,
        nighttimePoints: heartrateData.data ? heartrateData.data.filter(hr => {
          const hour = new Date(hr.timestamp).getHours();
          return hour >= 22 || hour <= 6;
        }).length : 0
      },
      hasData: !!(sleep || readiness || avgRestingHr),
      dataQuality: {
        hasSleep: !!sleep,
        hasReadiness: !!readiness,
        hasHeartRate: !!avgRestingHr
      }
    };

    console.log(`Data for ${date}:`, {
      hasSleep: result.dataQuality.hasSleep,
      hasReadiness: result.dataQuality.hasReadiness,
      hasHeartRate: result.dataQuality.hasHeartRate,
      hrDataPoints: result.heartrate.dataPoints
    });

    res.json(result);
  } catch (error) {
    console.error('Combined API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Jet Lag Tracker server running on http://localhost:${PORT}`);
  console.log(`📊 Access the app at http://localhost:${PORT}`);
});

