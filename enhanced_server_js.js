const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Airport Database with timezone information
const AIRPORT_DATABASE = {
  // Major UK airports
  'LHR': { timezone: 'Europe/London', offset: 0, city: 'London', longitude: -0.4543, name: 'Heathrow' },
  'LGW': { timezone: 'Europe/London', offset: 0, city: 'London', longitude: -0.1821, name: 'Gatwick' },
  'STN': { timezone: 'Europe/London', offset: 0, city: 'London', longitude: 0.235, name: 'Stansted' },
  'LTN': { timezone: 'Europe/London', offset: 0, city: 'London', longitude: -0.3686, name: 'Luton' },
  'MAN': { timezone: 'Europe/London', offset: 0, city: 'Manchester', longitude: -2.2750, name: 'Manchester' },
  'EDI': { timezone: 'Europe/London', offset: 0, city: 'Edinburgh', longitude: -3.3725, name: 'Edinburgh' },
  
  // Major US airports
  'LAX': { timezone: 'America/Los_Angeles', offset: -8, city: 'Los Angeles', longitude: -118.4085, name: 'Los Angeles Intl' },
  'SFO': { timezone: 'America/Los_Angeles', offset: -8, city: 'San Francisco', longitude: -122.3875, name: 'San Francisco Intl' },
  'JFK': { timezone: 'America/New_York', offset: -5, city: 'New York', longitude: -73.7781, name: 'John F Kennedy Intl' },
  'LGA': { timezone: 'America/New_York', offset: -5, city: 'New York', longitude: -73.8740, name: 'LaGuardia' },
  'EWR': { timezone: 'America/New_York', offset: -5, city: 'Newark', longitude: -74.1745, name: 'Newark Liberty Intl' },
  'ORD': { timezone: 'America/Chicago', offset: -6, city: 'Chicago', longitude: -87.9073, name: 'O\'Hare Intl' },
  'DFW': { timezone: 'America/Chicago', offset: -6, city: 'Dallas', longitude: -97.0372, name: 'Dallas/Fort Worth Intl' },
  'DEN': { timezone: 'America/Denver', offset: -7, city: 'Denver', longitude: -104.6737, name: 'Denver Intl' },
  'SEA': { timezone: 'America/Los_Angeles', offset: -8, city: 'Seattle', longitude: -122.3088, name: 'Seattle-Tacoma Intl' },
  
  // Major European airports
  'CDG': { timezone: 'Europe/Paris', offset: 1, city: 'Paris', longitude: 2.5479, name: 'Charles de Gaulle' },
  'FRA': { timezone: 'Europe/Berlin', offset: 1, city: 'Frankfurt', longitude: 8.5622, name: 'Frankfurt am Main' },
  'AMS': { timezone: 'Europe/Amsterdam', offset: 1, city: 'Amsterdam', longitude: 4.7683, name: 'Amsterdam Schiphol' },
  'MAD': { timezone: 'Europe/Madrid', offset: 1, city: 'Madrid', longitude: -3.5676, name: 'Madrid-Barajas' },
  'BCN': { timezone: 'Europe/Madrid', offset: 1, city: 'Barcelona', longitude: 2.0833, name: 'Barcelona-El Prat' },
  'FCO': { timezone: 'Europe/Rome', offset: 1, city: 'Rome', longitude: 12.2389, name: 'Rome Fiumicino' },
  'ZUR': { timezone: 'Europe/Zurich', offset: 1, city: 'Zurich', longitude: 8.5494, name: 'Zurich' },
  
  // Asian airports
  'NRT': { timezone: 'Asia/Tokyo', offset: 9, city: 'Tokyo', longitude: 140.3864, name: 'Narita Intl' },
  'HND': { timezone: 'Asia/Tokyo', offset: 9, city: 'Tokyo', longitude: 139.7798, name: 'Haneda' },
  'ICN': { timezone: 'Asia/Seoul', offset: 9, city: 'Seoul', longitude: 126.4417, name: 'Incheon Intl' },
  'SIN': { timezone: 'Asia/Singapore', offset: 8, city: 'Singapore', longitude: 103.9915, name: 'Singapore Changi' },
  'HKG': { timezone: 'Asia/Hong_Kong', offset: 8, city: 'Hong Kong', longitude: 113.9185, name: 'Hong Kong Intl' },
  'PEK': { timezone: 'Asia/Shanghai', offset: 8, city: 'Beijing', longitude: 116.5975, name: 'Beijing Capital Intl' },
  'PVG': { timezone: 'Asia/Shanghai', offset: 8, city: 'Shanghai', longitude: 121.8058, name: 'Shanghai Pudong Intl' },
  
  // Australian airports
  'SYD': { timezone: 'Australia/Sydney', offset: 10, city: 'Sydney', longitude: 151.1772, name: 'Sydney Kingsford Smith' },
  'MEL': { timezone: 'Australia/Melbourne', offset: 10, city: 'Melbourne', longitude: 144.8432, name: 'Melbourne' },
  'PER': { timezone: 'Australia/Perth', offset: 8, city: 'Perth', longitude: 115.9669, name: 'Perth' }
};

// API Key Management
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.jetlag_config.json');

const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return config;
    }
  } catch (error) {
    console.error('Failed to load config:', error.message);
  }
  return {};
};

const saveConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    fs.chmodSync(CONFIG_FILE, 0o600); // Make file readable only by owner
    return true;
  } catch (error) {
    console.error('Failed to save config:', error.message);
    return false;
  }
};

const saveApiKey = (apiKey) => {
  try {
    const config = loadConfig();
    config.oura_api_key = apiKey;
    return saveConfig(config);
  } catch (error) {
    console.error('Failed to save API key:', error.message);
    return false;
  }
};

const loadApiKey = () => {
  const config = loadConfig();
  return config.oura_api_key || null;
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Enhanced error handling function
const handleOuraAPIError = (error, operation) => {
  console.error(`${operation} error:`, error.message);
  
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    if (status === 401) {
      return { error: 'Invalid API token. Please check your Ōura credentials.', status };
    } else if (status === 429) {
      return { error: 'Rate limit exceeded. Please wait before making more requests.', status };
    } else if (status === 404) {
      return { error: 'Data not found for the requested date range.', status };
    } else {
      return { error: `API Error: ${message}`, status };
    }
  } else {
    return { error: `Network error: ${error.message}`, status: 500 };
  }
};

// API Key Management endpoints
app.post('/api/apikey/save', (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Basic validation
    if (apiKey.length < 20) {
      return res.status(400).json({ error: 'API key seems too short (should be longer than 20 characters)' });
    }
    
    const saved = saveApiKey(apiKey);
    if (saved) {
      res.json({ success: true, message: 'API key saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save API key - check server logs for details' });
    }
  } catch (error) {
    console.error('API key save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/apikey/load', (req, res) => {
  try {
    const apiKey = loadApiKey();
    if (apiKey) {
      // Return only the last 8 characters for security
      res.json({ 
        hasKey: true, 
        keyPreview: `...${apiKey.slice(-8)}` 
      });
    } else {
      res.json({ hasKey: false });
    }
  } catch (error) {
    console.error('API key load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/apikey', (req, res) => {
  try {
    const config = loadConfig();
    delete config.oura_api_key;
    
    if (Object.keys(config).length > 0) {
      // Save remaining config
      const saved = saveConfig(config);
      if (saved) {
        res.json({ success: true, message: 'API key removed successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update config file' });
      }
    } else {
      // Remove entire config file if empty
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      res.json({ success: true, message: 'API key removed successfully' });
    }
  } catch (error) {
    console.error('API key delete error:', error);
    res.status(500).json({ error: 'Failed to remove API key' });
  }
});

// Trip Details Management endpoints
app.post('/api/trip/save', (req, res) => {
  try {
    const { tripDetails } = req.body;
    
    if (!tripDetails) {
      return res.status(400).json({ error: 'Trip details are required' });
    }
    
    // Validate trip details structure
    const requiredFields = ['departureDate', 'departureAirport', 'arrivalAirport'];
    for (const field of requiredFields) {
      if (!tripDetails[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    
    const config = loadConfig();
    config.last_trip = {
      ...tripDetails,
      saved_at: new Date().toISOString()
    };
    
    const saved = saveConfig(config);
    if (saved) {
      res.json({ success: true, message: 'Trip details saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save trip details' });
    }
  } catch (error) {
    console.error('Trip save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/trip/load', (req, res) => {
  try {
    const config = loadConfig();
    if (config.last_trip) {
      res.json({ 
        hasTrip: true, 
        tripDetails: config.last_trip
      });
    } else {
      res.json({ hasTrip: false });
    }
  } catch (error) {
    console.error('Trip load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/trip', (req, res) => {
  try {
    const config = loadConfig();
    delete config.last_trip;
    
    if (Object.keys(config).length > 0) {
      const saved = saveConfig(config);
      if (saved) {
        res.json({ success: true, message: 'Trip details removed successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update config file' });
      }
    } else {
      // Remove entire config file if empty
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      res.json({ success: true, message: 'Trip details removed successfully' });
    }
  } catch (error) {
    console.error('Trip delete error:', error);
    res.status(500).json({ error: 'Failed to remove trip details' });
  }
});

// Airport and route endpoints
app.get('/api/airports', (req, res) => {
  const airportsByRegion = {
    'UK': Object.keys(AIRPORT_DATABASE).filter(code => AIRPORT_DATABASE[code].timezone === 'Europe/London'),
    'US West': ['LAX', 'SFO', 'SEA'],
    'US Central': ['ORD', 'DFW', 'DEN'],
    'US East': ['JFK', 'LGA', 'EWR'],
    'Europe': ['CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'ZUR'],
    'Asia': ['NRT', 'HND', 'ICN', 'SIN', 'HKG', 'PEK', 'PVG'],
    'Australia': ['SYD', 'MEL', 'PER']
  };
  
  const airportsWithDetails = {};
  for (const [region, codes] of Object.entries(airportsByRegion)) {
    airportsWithDetails[region] = codes.map(code => ({
      code,
      ...AIRPORT_DATABASE[code]
    }));
  }
  
  res.json(airportsWithDetails);
});

app.post('/api/route/calculate', (req, res) => {
  try {
    const { departure, arrival } = req.body;
    
    const departureInfo = AIRPORT_DATABASE[departure];
    const arrivalInfo = AIRPORT_DATABASE[arrival];
    
    if (!departureInfo || !arrivalInfo) {
      return res.status(400).json({ 
        error: `Airport data not available for ${!departureInfo ? departure : arrival}` 
      });
    }
    
    const timezoneShift = arrivalInfo.offset - departureInfo.offset;
    const direction = arrivalInfo.longitude > departureInfo.longitude ? 'east' : 'west';
    
    const routeDetails = {
      departure: {
        iata: departure,
        city: departureInfo.city,
        name: departureInfo.name,
        timezone: departureInfo.timezone
      },
      arrival: {
        iata: arrival,
        city: arrivalInfo.city,
        name: arrivalInfo.name,
        timezone: arrivalInfo.timezone
      },
      timezoneShift,
      direction
    };
    
    res.json(routeDetails);
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate route details' });
  }
});

// Enhanced Ōura API endpoints
app.get('/api/oura/test', async (req, res) => {
  try {
    let { authorization } = req.headers;
    
    // If no authorization header, try to use saved API key
    if (!authorization) {
      const savedKey = loadApiKey();
      if (savedKey) {
        authorization = `Bearer ${savedKey}`;
      } else {
        return res.status(401).json({ error: 'No API key provided. Please provide Authorization header or save an API key.' });
      }
    }
    
    const response = await axios.get('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({ 
      status: 'success', 
      userInfo: response.data,
      message: 'API access verified successfully'
    });
  } catch (error) {
    const errorResponse = handleOuraAPIError(error, 'API Test');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Enhanced combined endpoint with activity data
app.get('/api/oura/combined/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let { authorization } = req.headers;
    
    // If no authorization header, try to use saved API key
    if (!authorization) {
      const savedKey = loadApiKey();
      if (savedKey) {
        authorization = `Bearer ${savedKey}`;
      } else {
        return res.status(401).json({ error: 'No API key provided. Please provide Authorization header or save an API key.' });
      }
    }

    const headers = {
      'Authorization': authorization,
      'Content-Type': 'application/json'
    };

    console.log(`Fetching enhanced Ōura data for ${date}...`);

    // Create date windows for better data capture
    const targetDate = new Date(date);
    const startDate = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fetch all data types in parallel with enhanced error handling
    const [sleepResponse, readinessResponse, heartrateResponse, activityResponse] = await Promise.allSettled([
      axios.get(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`, { headers }),
      axios.get(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`, { headers }),
      axios.get(`https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${date}T00:00:00&end_datetime=${date}T23:59:59`, { headers }),
      axios.get(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`, { headers })
    ]);

    // Extract data from successful responses
    const sleepData = sleepResponse.status === 'fulfilled' ? sleepResponse.value.data : { data: [] };
    const readinessData = readinessResponse.status === 'fulfilled' ? readinessResponse.value.data : { data: [] };
    const heartrateData = heartrateResponse.status === 'fulfilled' ? heartrateResponse.value.data : { data: [] };
    const activityData = activityResponse.status === 'fulfilled' ? activityResponse.value.data : { data: [] };

    // Process the data with enhanced matching
    const sleep = sleepData.data?.find(record => record.day === date) || 
                 (sleepData.data?.length > 0 ? sleepData.data[0] : null);
    
    const readiness = readinessData.data?.find(record => record.day === date) || 
                     (readinessData.data?.length > 0 ? readinessData.data[0] : null);
    
    const activity = activityData.data?.find(record => record.day === date) || 
                    (activityData.data?.length > 0 ? activityData.data[0] : null);
    
    // Calculate nighttime resting heart rate with enhanced filtering
    let avgRestingHr = null;
    let hrDataPoints = 0;
    let nighttimePoints = 0;
    
    if (heartrateData.data && heartrateData.data.length > 0) {
      const nighttimeHR = heartrateData.data.filter(hr => {
        const hour = new Date(hr.timestamp).getHours();
        return hour >= 22 || hour <= 6;
      });
      
      hrDataPoints = heartrateData.data.length;
      nighttimePoints = nighttimeHR.length;
      
      if (nighttimeHR.length > 0) {
        avgRestingHr = nighttimeHR.reduce((sum, hr) => sum + hr.bpm, 0) / nighttimeHR.length;
      }
    }

    const result = {
      date,
      sleep,
      readiness,
      activity,
      heartrate: {
        bpm: avgRestingHr,
        dataPoints: hrDataPoints,
        nighttimePoints: nighttimePoints
      },
      hasData: !!(sleep || readiness || avgRestingHr || activity),
      dataQuality: {
        hasSleep: !!sleep,
        hasReadiness: !!readiness,
        hasHeartRate: !!avgRestingHr,
        hasActivity: !!activity
      },
      apiStatus: {
        sleep: sleepResponse.status === 'fulfilled' ? 'success' : 'failed',
        readiness: readinessResponse.status === 'fulfilled' ? 'success' : 'failed',
        heartrate: heartrateResponse.status === 'fulfilled' ? 'success' : 'failed',
        activity: activityResponse.status === 'fulfilled' ? 'success' : 'failed'
      }
    };

    console.log(`Enhanced data for ${date}:`, {
      hasSleep: result.dataQuality.hasSleep,
      hasReadiness: result.dataQuality.hasReadiness,
      hasHeartRate: result.dataQuality.hasHeartRate,
      hasActivity: result.dataQuality.hasActivity,
      hrDataPoints: result.heartrate.dataPoints
    });

    res.json(result);
  } catch (error) {
    console.error('Enhanced combined API error:', error.message);
    const errorResponse = handleOuraAPIError(error, 'Combined Data Fetch');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Individual endpoint for debugging
app.get('/api/oura/activity/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let { authorization } = req.headers;
    
    // If no authorization header, try to use saved API key
    if (!authorization) {
      const savedKey = loadApiKey();
      if (savedKey) {
        authorization = `Bearer ${savedKey}`;
      } else {
        return res.status(401).json({ error: 'No API key provided. Please provide Authorization header or save an API key.' });
      }
    }
    
    const targetDate = new Date(date);
    const startDate = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    const errorResponse = handleOuraAPIError(error, 'Activity Data');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    airports: Object.keys(AIRPORT_DATABASE).length,
    version: '2.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Jet Lag Tracker server running on http://localhost:${PORT}`);
  console.log(`📊 Access the app at http://localhost:${PORT}`);
  console.log(`✈️  Airport database loaded with ${Object.keys(AIRPORT_DATABASE).length} airports`);
});