# Jet Lag Recovery Tracker - Python Terminal Version

A Python script that analyses Oura Ring data to track recovery from jet lag using physiological metrics.

## Features

- **Real Oura API Integration**: Direct access to your physiological data
- **API Endpoint Verification**: Validates access before attempting analysis
- **Comprehensive Recovery Algorithm**: 
  - Body clock alignment (40% weight)
  - Heart rate recovery (25% weight) 
  - Temperature rhythm (20% weight)
  - Sleep efficiency (15% weight)
- **Personalised Recommendations**: Based on travel direction and recovery status
- **Terminal Interface**: Clean, efficient command-line interaction

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Get Your Oura API Token**:
   - Visit [Oura Cloud Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
   - Generate a new token with read permissions
   - Keep this token secure

3. **Run the Script**:
   ```bash
   python3 jetlag_recovery_tracker.py
   ```

## Usage

The script will prompt you for:

1. **Oura API Token**: Your personal access token
2. **Departure Date/Time**: In ISO format (YYYY-MM-DDTHH:MM)
3. **Destination**: Text description of where you travelled
4. **Timezone Shift**: Hours difference (e.g., +8 for London from San Francisco)
5. **Travel Direction**: 'east' or 'west'

## Example Output

```
📱 Jet Lag Recovery Tracker
==================================================

🔍 Verifying Oura API access...
✅ API access verified for: user@example.com

📊 Analysing 7 days of data...
Travel date: 2025-07-20 14:30
Days since travel: 7

  Day 1: 2025-07-21 ✅ Recovery: 45.2%
  Day 2: 2025-07-22 ✅ Recovery: 62.8%
  Day 3: 2025-07-23 ✅ Recovery: 78.1%
  ...

============================================================
📈 JET LAG RECOVERY ANALYSIS  
============================================================

🔶 Current Recovery: 85.3%

📊 Latest Metrics (Day 7):
   ❤️  Resting HR: 54.2 bpm
   😴 Sleep Efficiency: 89.1%
   🌡️  Temperature Deviation: -0.15°C

💡 Personalised Recommendations:
   1. ☀️  Seek bright light exposure in early morning to advance your circadian rhythm
   2. 🏃 Keep exercise light and preferably in the morning to support circadian adjustment
```

## Data Privacy

- All API calls are made directly from your machine to Oura
- No data is stored or transmitted to third parties
- Your token and physiological data remain completely private

## Algorithm Details

The recovery score combines four key circadian rhythm indicators:

- **Body Clock Alignment**: Compares actual sleep midpoint to optimal time for destination timezone
- **Heart Rate Recovery**: Measures deviation from your baseline nighttime resting heart rate
- **Temperature Rhythm**: Uses body temperature trend deviation as circadian phase marker
- **Sleep Efficiency**: Compares current sleep quality to personal baseline

## Requirements

- Python 3.7+
- Active Oura Ring subscription with data syncing
- Personal Oura API token

## Troubleshooting

- **"No valid Oura data found"**: Ensure your ring was syncing during the travel period
- **API authentication errors**: Verify your token is correct and has read permissions
- **Missing data warnings**: Normal for days with incomplete ring usage