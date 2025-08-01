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

// Fixed combined endpoint with proper sleep data handling
// Replace the combined endpoint in your server.js with this version

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

        console.log(`\n=== Combined Endpoint for ${date} ===`);

        // For sleep data, we need to query a range instead of a single date
        // Query from the day before to the day after to catch sleep that spans dates
        const queryDate = new Date(date);
        const prevDate = new Date(queryDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const nextDate = new Date(queryDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const nextDateStr = nextDate.toISOString().split('T')[0];

        console.log(`Querying sleep data from ${prevDateStr} to ${nextDateStr} to find data for ${date}`);

        // Fetch all data types in parallel
        const [sleepResponse, readinessResponse, heartrateResponse] = await Promise.allSettled([
            axios.get(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${prevDateStr}&end_date=${nextDateStr}`, { headers }),
            axios.get(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${date}&end_date=${date}`, { headers }),
            axios.get(`https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${date}T00:00:00&end_datetime=${date}T23:59:59`, { headers })
        ]);

        // Log the sleep response status
        console.log(`Sleep response status: ${sleepResponse.status}`);
        
        if (sleepResponse.status === 'fulfilled') {
            console.log('Sleep API response:', {
                status: sleepResponse.value.status,
                dataExists: !!sleepResponse.value.data,
                dataKeys: sleepResponse.value.data ? Object.keys(sleepResponse.value.data) : [],
                hasDataArray: !!sleepResponse.value.data?.data,
                dataLength: sleepResponse.value.data?.data?.length || 0,
                dates: sleepResponse.value.data?.data?.map(s => s.day) || []
            });
        } else {
            console.error('Sleep API failed:', sleepResponse.reason?.message);
        }

        // Extract data from successful responses
        const sleepData = sleepResponse.status === 'fulfilled' ? sleepResponse.value.data : null;
        const readinessData = readinessResponse.status === 'fulfilled' ? readinessResponse.value.data : null;
        const heartrateData = heartrateResponse.status === 'fulfilled' ? heartrateResponse.value.data : null;

        // Process sleep data - handle the structure correctly
        let sleep = null;
        if (sleepData && sleepData.data && Array.isArray(sleepData.data)) {
            console.log(`Sleep data array length: ${sleepData.data.length}`);
            console.log(`Sleep records found:`, sleepData.data.map(s => ({
                day: s.day,
                bedtime_start: s.bedtime_start,
                bedtime_end: s.bedtime_end
            })));
            
            if (sleepData.data.length > 0) {
                // Find the sleep record for our target date
                // Sleep is associated with the day it ends
                sleep = sleepData.data.find(s => s.day === date);
                
                if (sleep) {
                    console.log(`Found sleep record for ${date}:`, {
                        day: sleep.day,
                        efficiency: sleep.efficiency,
                        bedtime_start: sleep.bedtime_start,
                        bedtime_end: sleep.bedtime_end
                    });
                } else {
                    console.log(`No sleep record found for specific date ${date} in the returned data`);
                }
            } else {
                console.log('Sleep data array is empty');
            }
        } else {
            console.log('No sleep data structure found:', {
                hasSleepData: !!sleepData,
                sleepDataKeys: sleepData ? Object.keys(sleepData) : null
            });
        }

        // Process readiness data
        let readiness = null;
        if (readinessData && readinessData.data && Array.isArray(readinessData.data)) {
            readiness = readinessData.data.find(r => r.day === date) || 
                       (readinessData.data.length > 0 ? readinessData.data[0] : null);
        }
        
        // Calculate nighttime resting heart rate
        let avgRestingHr = null;
        if (heartrateData && heartrateData.data && Array.isArray(heartrateData.data) && heartrateData.data.length > 0) {
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
                dataPoints: heartrateData?.data?.length || 0,
                nighttimePoints: heartrateData?.data ? heartrateData.data.filter(hr => {
                    const hour = new Date(hr.timestamp).getHours();
                    return hour >= 22 || hour <= 6;
                }).length : 0
            },
            hasData: !!(sleep || readiness || avgRestingHr),
            dataQuality: {
                hasSleep: !!sleep,
                hasReadiness: !!readiness,
                hasHeartRate: !!avgRestingHr
            },
            debug: {
                sleepApiResponsed: sleepResponse.status === 'fulfilled',
                sleepRecordsInResponse: sleepData?.data?.length || 0,
                queriedDate: date,
                actualSleepDate: sleep?.day || null,
                queryRange: `${prevDateStr} to ${nextDateStr}`
            }
        };

        console.log(`Final result for ${date}:`, {
            hasSleep: result.dataQuality.hasSleep,
            sleepEfficiency: result.sleep?.efficiency || 'No sleep data',
            hasReadiness: result.dataQuality.hasReadiness,
            hasHeartRate: result.dataQuality.hasHeartRate,
            debug: result.debug
        });

        res.json(result);
    } catch (error) {
        console.error('Combined API error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: error.message,
            status: error.response?.status,
            details: error.response?.data
        });
    }
});

// Test endpoint
app.get('/api/oura/test', async (req, res) => {
  try {
    const { authorization } = req.headers;
    
    console.log('\n=== API Test ===');
    
    // Personal info test
    const personalInfo = await axios.get('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: { 'Authorization': authorization }
    });
    
    // Direct sleep test for last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sleepData = await axios.get(
      `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
      { headers: { 'Authorization': authorization } }
    );
    
    console.log('Sleep test results:', {
      recordCount: sleepData.data?.data?.length || 0,
      dates: sleepData.data?.data?.map(s => s.day).slice(0, 5) || []
    });
    
    res.json({ 
      status: 'success', 
      userInfo: personalInfo.data,
      sleepRecordCount: sleepData.data?.data?.length || 0,
      recentSleepDates: sleepData.data?.data?.map(s => s.day).slice(0, 5) || []
    });
  } catch (error) {
    console.error('Test API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Add sleep range endpoint for checking data availability
app.get('/api/oura/sleep-range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const { authorization } = req.headers;
    
    console.log(`\n=== Checking sleep data from ${startDate} to ${endDate} ===`);
    
    const response = await axios.get(
      `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`, 
      {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Sleep range query results:`, {
      totalRecords: response.data.data ? response.data.data.length : 0,
      dates: response.data.data ? response.data.data.map(s => ({
        day: s.day,
        bedtime_start: s.bedtime_start,
        bedtime_end: s.bedtime_end,
        efficiency: s.efficiency
      })) : []
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Sleep range API error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Direct sleep test - mimics curl exactly
app.get('/api/oura/sleep-direct-test', async (req, res) => {
    try {
        const { authorization } = req.headers;
        
        // Log the exact headers being sent
        console.log('\n=== Direct Sleep Test ===');
        console.log('Authorization header:', authorization ? `Bearer ${authorization.substring(0, 10)}...` : 'Missing');
        
        // Test with exact curl parameters
        const testUrl = 'https://api.ouraring.com/v2/usercollection/sleep?start_date=2025-07-01&end_date=2025-07-30';
        console.log('Request URL:', testUrl);
        
        const response = await axios({
            method: 'GET',
            url: testUrl,
            headers: {
                'Authorization': authorization,
                'Accept': 'application/json'
            }
        });
        
        console.log('Raw response data structure:', {
            hasData: !!response.data,
            hasDataArray: !!response.data?.data,
            dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
            recordCount: response.data?.data?.length || 0,
            firstRecord: response.data?.data?.[0] ? Object.keys(response.data.data[0]) : null
        });
        
        res.json({
            success: true,
            recordCount: response.data?.data?.length || 0,
            sampleRecord: response.data?.data?.[0] || null,
            dates: response.data?.data?.map(s => s.day) || []
        });
        
    } catch (error) {
        console.error('Direct test error:', error.message);
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data
        });
    }
});

// Test different sleep endpoints
app.get('/api/oura/sleep-endpoints-test', async (req, res) => {
    const { authorization } = req.headers;
    const results = {};
    
    const endpoints = [
        { name: 'v2_sleep', url: 'https://api.ouraring.com/v2/usercollection/sleep' },
        { name: 'v2_daily_sleep', url: 'https://api.ouraring.com/v2/usercollection/daily_sleep' },
        { name: 'v2_sleep_periods', url: 'https://api.ouraring.com/v2/usercollection/sleep_periods' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(
                `${endpoint.url}?start_date=2025-07-01&end_date=2025-07-30`,
                {
                    headers: {
                        'Authorization': authorization,
                        'Accept': 'application/json'
                    }
                }
            );
            
            results[endpoint.name] = {
                success: true,
                recordCount: response.data?.data?.length || 0,
                dataStructure: response.data ? Object.keys(response.data) : null
            };
        } catch (error) {
            results[endpoint.name] = {
                success: false,
                error: error.response?.status || error.message
            };
        }
    }
    
    res.json(results);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'Jet Lag Tracker API',
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jet Lag Tracker server running on http://localhost:${PORT}`);
  console.log(`📊 Access the app at http://localhost:${PORT}`);
  console.log(`❤️  Health check at http://localhost:${PORT}/api/health`);
});