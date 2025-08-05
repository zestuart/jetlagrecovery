# Enhanced Jet Lag Recovery Tracker v2.0

An advanced physiological analysis tool that uses real Ōura Ring data to track recovery from jet lag with airport-based route calculation and activity-adjusted metrics.

## 🆕 What's New in v2.0

### ✈️ Airport Database Integration
- **30+ Major Airports**: Pre-loaded database covering UK, US, Europe, Asia, and Australia
- **Automatic Route Calculation**: Select departure and arrival airports for automatic timezone shift calculation
- **IATA Code Support**: Professional airport selection with city names and full airport descriptions
- **Directional Analysis**: Automatic east/west travel direction detection for optimised recommendations

### 🏃 Activity-Adjusted Recovery Metrics
- **Training Load Integration**: Heart rate recovery calculations now account for active calories and training volume
- **Dynamic Baselines**: Automatic adjustment for high-intensity training days
- **Enhanced Accuracy**: More realistic recovery scores during active travel periods

### 📊 Component Breakdown Analysis
- **Weighted Scoring System**: 
  - Sleep Alignment (40%): Circadian rhythm adaptation
  - Heart Rate Recovery (25%): Cardiovascular normalisation
  - Temperature Rhythm (20%): Core body temperature alignment
  - Sleep Quality (15%): Sleep efficiency metrics
- **Real-time Component Display**: Visual breakdown of each recovery factor
- **Debug Information**: Detailed analysis of score calculations

### 🎯 Enhanced Recommendations Engine
- **Priority-Based Suggestions**: High, medium, and low priority recommendations
- **Travel Direction Specific**: Tailored advice for eastward vs westward travel
- **Recovery Stage Aware**: Different recommendations based on days since travel
- **Activity Considerations**: Adjusted recommendations for active travellers

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd jetlagrecovery

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the development server
npm run dev
```

### Setup
1. **Get your Ōura API token** from [Ōura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. **Access the app** at http://localhost:3001
3. **Test your API connection** using the enhanced test button
4. **Select your route** using airport codes (e.g., SFO → LHR)
5. **Start analysis** to receive comprehensive recovery metrics

## 🛫 Supported Airports

### UK Airports
- **LHR** - London Heathrow
- **LGW** - London Gatwick  
- **STN** - London Stansted
- **LTN** - London Luton
- **MAN** - Manchester
- **EDI** - Edinburgh

### US Airports
- **West Coast**: LAX (Los Angeles), SFO (San Francisco), SEA (Seattle)
- **Central**: ORD (Chicago), DFW (Dallas), DEN (Denver)
- **East Coast**: JFK, LGA, EWR (New York area)

### International
- **Europe**: CDG (Paris), FRA (Frankfurt), AMS (Amsterdam), MAD (Madrid), BCN (Barcelona), FCO (Rome), ZUR (Zurich)
- **Asia**: NRT/HND (Tokyo), ICN (Seoul), SIN (Singapore), HKG (Hong Kong), PEK/PVG (China)
- **Australia**: SYD (Sydney), MEL (Melbourne), PER (Perth)

## 📈 Enhanced Analysis Features

### Recovery Scoring Algorithm
The enhanced algorithm calculates recovery based on four key physiological markers:

```
Recovery Score = (Sleep Alignment × 40%) + 
                (HR Recovery × 25%) + 
                (Temperature × 20%) + 
                (Sleep Quality × 15%)
```

### Activity Integration
- **High Training Load** (>800 active calories): +5 bpm HR tolerance
- **Moderate Training** (>500 active calories): +3 bpm HR tolerance  
- **Training Volume** consideration for endurance activities
- **Caloric Expenditure** analysis for metabolic load

### Data Quality Tracking
- Real-time monitoring of available data sources
- Sleep, heart rate, readiness, and activity data validation
- Enhanced error handling and retry logic
- Comprehensive API status reporting

## 🔧 Technical Architecture

### Backend (Node.js/Express)
- **Airport Database**: In-memory timezone and coordinate database
- **Enhanced API Proxy**: Improved error handling and rate limiting
- **Route Calculation**: Automatic timezone shift and direction calculation
- **Data Aggregation**: Multi-source Ōura data combination

### Frontend (React)
- **Airport Selector**: Searchable dropdown with regional grouping
- **Component Visualisation**: Real-time recovery factor breakdown
- **Enhanced UI**: Priority-based recommendations and data quality indicators
- **Responsive Design**: Mobile-optimised interface

### API Endpoints
```
GET  /api/airports              # Airport database
POST /api/route/calculate       # Route calculation
GET  /api/oura/test            # Enhanced API testing
GET  /api/oura/combined/:date  # Multi-source data aggregation
GET  /api/oura/activity/:date  # Activity-specific endpoint
GET  /api/health               # System health check
```

## 🧬 Scientific Basis

### Circadian Rhythm Science
- **Sleep Midpoint Analysis**: Optimal 03:00 local time target
- **Phase Shift Calculation**: Gradual adjustment tracking
- **Light Therapy Timing**: Direction-specific recommendations

### Physiological Markers
- **Heart Rate Variability**: Autonomic nervous system recovery
- **Core Body Temperature**: Circadian phase indicator
- **Sleep Architecture**: REM and deep sleep efficiency
- **Activity Load**: Training stress consideration

### Recovery Timeline
- **Days 1-3**: Acute phase with high variability
- **Days 4-7**: Adaptation phase with gradual improvement  
- **Days 8-14**: Stabilisation phase approaching baseline
- **Day 15+**: Full recovery expected for most individuals

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start with auto-reload
npm run dev

# Production build
npm start
```

### Environment Variables
```bash
PORT=3001                              # Server port
NODE_ENV=development                   # Environment
OURA_RATE_LIMIT=60                    # API rate limiting
MAX_ANALYSIS_DAYS=14                  # Maximum analysis period
DEFAULT_BASELINE_HR=52                # Default baseline heart rate
DEFAULT_BASELINE_SLEEP_EFFICIENCY=88  # Default sleep efficiency
```

### API Integration
The application uses the Ōura Ring API v2 with the following endpoints:
- Personal Information
- Daily Sleep Data  
- Daily Readiness Data
- Heart Rate Data (5-minute intervals)
- Daily Activity Data (NEW in v2.0)

## 📊 Data Privacy

- **Local Processing**: All data processed on your local machine
- **No Data Storage**: No user data stored on external servers
- **API Proxy Only**: Server acts only as CORS proxy to Ōura API
- **Secure Transmission**: HTTPS communication with Ōura API

## 🔬 Validation Studies

The enhanced algorithm incorporates research from:
- **Circadian Biology**: Light therapy and phase shifting protocols
- **Sports Science**: Activity load and recovery relationship
- **Sleep Medicine**: Sleep efficiency and recovery correlation
- **Aviation Medicine**: Jet lag recovery optimisation

## 🤝 Contributing

### Feature Requests
- Additional airport support
- New physiological markers
- Enhanced recommendation algorithms
- Mobile app development

### Technical Improvements
- Database integration for historical tracking
- Machine learning recovery prediction
- Social features for travel groups
- Integration with other wearable devices

## 📞 Support

For technical issues:
1. Check the debug log in the application
2. Verify your Ōura API token is valid
3. Ensure your ring was syncing during travel dates
4. Review supported airports list

For feature requests or bug reports, please create an issue in the repository.

## 📜 Licence

MIT Licence - see LICENCE file for details.

## 🙏 Acknowledgements

- **Ōura Health**: For providing comprehensive physiological data API
- **Aviation Industry**: For standardised IATA airport codes
- **Research Community**: For circadian rhythm and jet lag studies
- **Life360 IT Team**: For development and testing

---

**Version**: 2.0.0  
**Last Updated**: August 2025  
**Compatibility**: Ōura Ring Gen 2/3, API v2