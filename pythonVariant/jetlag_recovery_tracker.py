#!/usr/bin/env python3
"""
Jet Lag Recovery Tracker - Python Terminal Version
Analyses Oura Ring data to track recovery from jet lag using physiological metrics.
"""

import warnings
# Suppress urllib3 SSL warning before importing requests
warnings.filterwarnings('ignore', message='urllib3 v2 only supports OpenSSL 1.1.1+')

import requests
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import time


class OuraAPIClient:
    """Handles all interactions with the Oura Ring API."""
    
    BASE_URL = "https://api.ouraring.com/v2"
    
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def verify_endpoints(self) -> bool:
        """Verify API access and endpoint availability."""
        print("🔍 Verifying Oura API access...")
        
        try:
            # Test personal info endpoint
            response = self.session.get(f"{self.BASE_URL}/usercollection/personal_info")
            if response.status_code == 200:
                user_info = response.json()
                print(f"✅ API access verified for: {user_info.get('email', 'Unknown user')}")
                
                # Test sleep API with recent date and detailed debugging
                test_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                print(f"🔍 Testing sleep API with date: {test_date}")
                sleep_response = self.session.get(f"{self.BASE_URL}/usercollection/sleep", 
                                                params={'start_date': test_date, 'end_date': test_date})
                print(f"   Sleep API test: {sleep_response.status_code}")
                if sleep_response.status_code == 200:
                    sleep_data = sleep_response.json()
                    print(f"   Sleep records found: {len(sleep_data.get('data', []))}")
                    print(f"   Full sleep response: {json.dumps(sleep_data, indent=2)[:500]}...")
                    
                    # Try a broader date range (last 7 days)
                    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
                    print(f"🔍 Testing broader date range: {week_ago} to {test_date}")
                    broad_response = self.session.get(f"{self.BASE_URL}/usercollection/sleep", 
                                                    params={'start_date': week_ago, 'end_date': test_date})
                    if broad_response.status_code == 200:
                        broad_data = broad_response.json()
                        print(f"   7-day sleep records: {len(broad_data.get('data', []))}")
                        if broad_data.get('data'):
                            print(f"   Sample sleep record keys: {list(broad_data['data'][0].keys())}")
                    
                    # Test activity API
                    print(f"🔍 Testing activity API...")
                    activity_response = self.session.get(f"{self.BASE_URL}/usercollection/daily_activity", 
                                                       params={'start_date': week_ago, 'end_date': test_date})
                    print(f"   Activity API test: {activity_response.status_code}")
                    if activity_response.status_code == 200:
                        activity_data = activity_response.json()
                        print(f"   Activity records found: {len(activity_data.get('data', []))}")
                        if activity_data.get('data'):
                            print(f"   Sample activity keys: {list(activity_data['data'][0].keys())}")
                    else:
                        print(f"   Activity API error: {activity_response.text[:200]}")
                        
                else:
                    print(f"   Sleep API error: {sleep_response.text[:200]}")
                    
                # Also test what data scopes are available
                print(f"🔍 Checking available data scopes...")
                scopes_response = self.session.get(f"{self.BASE_URL}/usercollection/personal_info")
                if scopes_response.status_code == 200:
                    personal_data = scopes_response.json()
                    print(f"   Available data in personal info: {list(personal_data.keys())}")
                    
                return True
            elif response.status_code == 401:
                print("❌ Authentication failed. Please check your API token.")
                return False
            else:
                print(f"❌ API verification failed with status {response.status_code}")
                return False
                
        except requests.RequestException as e:
            print(f"❌ Network error during API verification: {e}")
            return False
    
    def get_sleep_data(self, date: str) -> Optional[Dict]:
        """Fetch sleep data for a specific date using a broader date range."""
        try:
            # Use a 3-day window centered on the target date to handle timezone issues
            target_date = datetime.strptime(date, '%Y-%m-%d')
            start_date = (target_date - timedelta(days=1)).strftime('%Y-%m-%d')
            end_date = (target_date + timedelta(days=1)).strftime('%Y-%m-%d')
            
            url = f"{self.BASE_URL}/usercollection/sleep"
            params = {'start_date': start_date, 'end_date': end_date}
            response = self.session.get(url, params=params)
            
            print(f"    Sleep API: {response.status_code}", end="")
            
            if response.status_code == 200:
                data = response.json()
                all_records = data.get('data', [])
                print(f" ({len(all_records)} records)", end="")
                
                # Find record that matches our target date
                for record in all_records:
                    record_date = record.get('day', '')
                    if record_date == date:
                        efficiency = record.get('efficiency', 'N/A')
                        print(f" [Eff: {efficiency}%]", end="")
                        return record
                
                # If no exact match, check if we have records from adjacent dates
                if all_records:
                    print(f" [Using closest: {all_records[0].get('day', 'unknown')}]", end="")
                    return all_records[0]  # Use the first available record
                else:
                    print(" [No sleep data]", end="")
                    return None
            else:
                print(f" [Error: {response.status_code}]", end="")
                try:
                    error_data = response.json()
                    print(f" {error_data.get('message', 'Unknown error')}", end="")
                except:
                    pass
            return None
        except Exception as e:
            print(f" [Exception: {str(e)[:50]}]", end="")
            return None

    def get_readiness_data(self, date: str) -> Optional[Dict]:
        """Fetch readiness data for a specific date using a broader date range."""
        try:
            # Use a 3-day window centered on the target date to handle timezone issues
            target_date = datetime.strptime(date, '%Y-%m-%d')
            start_date = (target_date - timedelta(days=1)).strftime('%Y-%m-%d')
            end_date = (target_date + timedelta(days=1)).strftime('%Y-%m-%d')
            
            url = f"{self.BASE_URL}/usercollection/daily_readiness"
            params = {'start_date': start_date, 'end_date': end_date}
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                all_records = data.get('data', [])
                
                # Find record that matches our target date
                for record in all_records:
                    record_date = record.get('day', '')
                    if record_date == date:
                        return record
                
                # If no exact match, use the first available record
                if all_records:
                    return all_records[0]
                    
            return None
        except Exception as e:
            print(f"Warning: Readiness data fetch failed for {date}: {e}")
            return None

    def get_heartrate_data(self, date: str) -> Optional[float]:
        """Fetch and calculate nighttime resting heart rate for a specific date."""
        try:
            # Use a broader time window to ensure we capture nighttime data
            target_date = datetime.strptime(date, '%Y-%m-%d')
            start_datetime = (target_date - timedelta(hours=6)).strftime('%Y-%m-%dT18:00:00')
            end_datetime = (target_date + timedelta(hours=18)).strftime('%Y-%m-%dT12:00:00')
            
            url = f"{self.BASE_URL}/usercollection/heartrate"
            params = {
                'start_datetime': start_datetime,
                'end_datetime': end_datetime
            }
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if not data.get('data'):
                    return None
                
                # Calculate nighttime resting HR (22:00-06:00 in local time)
                nighttime_readings = []
                for reading in data['data']:
                    timestamp = datetime.fromisoformat(reading['timestamp'].replace('Z', '+00:00'))
                    hour = timestamp.hour
                    if hour >= 22 or hour <= 6:
                        nighttime_readings.append(reading['bpm'])
                
                if nighttime_readings:
                    return sum(nighttime_readings) / len(nighttime_readings)
            return None
        except Exception as e:
            print(f"Warning: Heart rate data fetch failed for {date}: {e}")
            return None

    def get_activity_data(self, date: str) -> Optional[Dict]:
        """Fetch activity data for a specific date."""
        try:
            # Use a 3-day window like other endpoints
            target_date = datetime.strptime(date, '%Y-%m-%d')
            start_date = (target_date - timedelta(days=1)).strftime('%Y-%m-%d')
            end_date = (target_date + timedelta(days=1)).strftime('%Y-%m-%d')
            
            url = f"{self.BASE_URL}/usercollection/daily_activity"
            params = {'start_date': start_date, 'end_date': end_date}
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                all_records = data.get('data', [])
                
                # Find record that matches our target date
                for record in all_records:
                    record_date = record.get('day', '')
                    if record_date == date:
                        return record
                
                # If no exact match, use the first available record
                if all_records:
                    return all_records[0]
                    
            return None
        except Exception as e:
            print(f"Warning: Activity data fetch failed for {date}: {e}")
            return None


class JetLagAnalyser:
    """Core logic for calculating jet lag recovery metrics."""
    
    def __init__(self, baseline_hr: float = 52.0, baseline_sleep_efficiency: float = 88.0):
        self.baseline_hr = baseline_hr
        self.baseline_sleep_efficiency = baseline_sleep_efficiency
    
    def calculate_sleep_midpoint(self, sleep_data: Dict) -> Optional[str]:
        """Calculate the midpoint of sleep period."""
        try:
            start = datetime.fromisoformat(sleep_data['bedtime_start'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(sleep_data['bedtime_end'].replace('Z', '+00:00'))
            midpoint = start + (end - start) / 2
            return midpoint.strftime('%H:%M')
        except (KeyError, ValueError):
            return None
    
    def adjusted_optimal_midpoint(self, timezone_shift: int) -> str:
        """Calculate optimal sleep midpoint for the destination timezone."""
        # Target should always be local optimal time (03:00), not shifted time
        # The timezone_shift tells us how far we traveled, but we want to adapt to local time
        base_hour = 3  # 03:00 optimal sleep midpoint in destination timezone
        return f"{base_hour:02d}:00"
    
    def time_difference_hours(self, time1: str, time2: str) -> float:
        """Calculate circular time difference in hours."""
        def time_to_minutes(time_str):
            h, m = map(int, time_str.split(':'))
            return h * 60 + m
        
        minutes1 = time_to_minutes(time1)
        minutes2 = time_to_minutes(time2)
        diff = abs(minutes1 - minutes2)
        return min(diff, 1440 - diff) / 60
    
    def calculate_recovery_score(self, oura_data: Dict, timezone_shift: int, days_since_travel: int) -> Optional[float]:
        """Calculate overall recovery score from Oura data, adjusted for activity."""
        if days_since_travel == 0:
            return 100.0
        
        if not any([oura_data.get('sleep'), oura_data.get('readiness'), oura_data.get('resting_hr')]):
            return None
        
        total_weight = 0
        weighted_score = 0
        component_scores = {}
        
        # Body clock alignment (40% weight)
        sleep_data = oura_data.get('sleep')
        if sleep_data and 'bedtime_start' in sleep_data and 'bedtime_end' in sleep_data:
            sleep_midpoint = self.calculate_sleep_midpoint(sleep_data)
            if sleep_midpoint:
                target_midpoint = self.adjusted_optimal_midpoint(timezone_shift)
                time_diff = self.time_difference_hours(sleep_midpoint, target_midpoint)
                
                # More lenient alignment scoring
                if time_diff <= 1.5:
                    alignment = 100
                elif time_diff <= 3.0:
                    alignment = 100 - (time_diff - 1.5) * 40
                else:
                    alignment = max(0, 100 - time_diff * 15)
                
                component_scores['sleep_alignment'] = {
                    'score': alignment,
                    'sleep_midpoint': sleep_midpoint,
                    'target_midpoint': target_midpoint,
                    'time_diff_hours': time_diff
                }
                
                weighted_score += alignment * 0.4
                total_weight += 0.4
        
        # Heart rate recovery (25% weight) - adjusted for activity
        resting_hr = oura_data.get('resting_hr')
        if resting_hr:
            hr_deviation = abs(resting_hr - self.baseline_hr)
            
            # Activity adjustment
            activity_data = oura_data.get('activity')
            activity_adjustment = 0
            if activity_data:
                # Calculate training stress score based on activity
                total_calories = activity_data.get('total_calories', 0)
                active_calories = activity_data.get('active_calories', 0)
                training_volume = activity_data.get('training_volume', 0)
                
                # High training load increases expected HR deviation
                if total_calories > 3000 or active_calories > 800 or training_volume > 300:
                    activity_adjustment = 5  # Allow 5 bpm extra deviation for heavy training
                elif total_calories > 2500 or active_calories > 500 or training_volume > 200:
                    activity_adjustment = 3  # Allow 3 bpm extra for moderate training
                
                component_scores['activity_load'] = {
                    'total_calories': total_calories,
                    'active_calories': active_calories,
                    'training_volume': training_volume,
                    'hr_adjustment': activity_adjustment
                }
            
            # Apply activity-adjusted scoring
            adjusted_deviation = max(0, hr_deviation - activity_adjustment)
            if adjusted_deviation <= 5:
                hr_recovery = 100
            else:
                hr_recovery = max(0, 100 - (adjusted_deviation - 5) * 8)
            
            component_scores['hr_recovery'] = {
                'score': hr_recovery,
                'current_hr': resting_hr,
                'baseline_hr': self.baseline_hr,
                'raw_deviation': hr_deviation,
                'adjusted_deviation': adjusted_deviation
            }
            
            weighted_score += hr_recovery * 0.25
            total_weight += 0.25
        
        # Temperature rhythm (20% weight)
        readiness_data = oura_data.get('readiness')
        if readiness_data and readiness_data.get('temperature_trend_deviation') is not None:
            temp_deviation = readiness_data['temperature_trend_deviation']
            if abs(temp_deviation) <= 0.1:
                temp_alignment = 100
            else:
                temp_alignment = max(0, 100 - (abs(temp_deviation) - 0.1) * 200)
            
            component_scores['temp_alignment'] = {
                'score': temp_alignment,
                'deviation': temp_deviation
            }
            
            weighted_score += temp_alignment * 0.2
            total_weight += 0.2
        
        # Sleep efficiency (15% weight)
        if sleep_data and sleep_data.get('efficiency'):
            sleep_quality = min(100, (sleep_data['efficiency'] / self.baseline_sleep_efficiency) * 100)
            
            component_scores['sleep_quality'] = {
                'score': sleep_quality,
                'efficiency': sleep_data['efficiency'],
                'baseline': self.baseline_sleep_efficiency
            }
            
            weighted_score += sleep_quality * 0.15
            total_weight += 0.15
        
        final_score = (weighted_score / total_weight) if total_weight > 0.3 else None
        
        # Store component scores for debugging
        self.debug_components = component_scores
        
        return final_score


class JetLagTracker:
    """Main application class."""
    
    def __init__(self):
        self.oura_client = None
        self.analyser = JetLagAnalyser()
        self.recovery_data = []
        self.latest_debug_components = {}
    
    def get_user_input(self) -> Tuple[str, str, str, int, str]:
        """Collect user input for analysis."""
        print("\n📱 Jet Lag Recovery Tracker")
        print("=" * 50)
        
        # API Token
        token = input("Enter your Oura API token: ").strip()
        if not token:
            print("❌ API token is required")
            sys.exit(1)
        
        # Travel details
        print("\n✈️  Travel Details")
        departure = input("Departure date and time (YYYY-MM-DDTHH:MM): ").strip()
        try:
            # Validate date format
            datetime.fromisoformat(departure)
        except ValueError:
            print("❌ Invalid date format. Use YYYY-MM-DDTHH:MM")
            sys.exit(1)
        
        destination = input("Destination: ").strip()
        
        try:
            timezone_shift = int(input("Timezone shift in hours (e.g., +8 for London from SF): "))
        except ValueError:
            print("❌ Invalid timezone shift")
            sys.exit(1)
        
        direction = input("Travel direction (east/west): ").strip().lower()
        if direction not in ['east', 'west']:
            print("❌ Direction must be 'east' or 'west'")
            sys.exit(1)
        
        return token, departure, destination, timezone_shift, direction
    
    def generate_recommendations(self, recovery_score: float, direction: str, days_since_travel: int) -> List[str]:
        """Generate personalised recovery recommendations."""
        recommendations = []
        
        # Fixed threshold logic
        if recovery_score >= 90 or days_since_travel > 21:
            recommendations.append("🎯 Full recovery achieved! Your circadian rhythm should be completely adapted.")
            return recommendations
        
        if recovery_score < 75:
            if direction == 'east':
                recommendations.append("☀️  Seek bright light exposure in early morning to advance your circadian rhythm")
            else:
                recommendations.append("🌙 Avoid bright light in the evening after 19:00 to delay your circadian rhythm")
        
        if recovery_score < 65:
            recommendations.append("💊 Consider 1-2mg melatonin 30 minutes before target bedtime")
        
        if days_since_travel <= 7:  # Extended from 3 days
            recommendations.append("🏃 Keep exercise light and preferably in the morning to support circadian adjustment")
        
        if recovery_score < 80 and days_since_travel > 14:
            recommendations.append("🔄 Consider adjusting sleep schedule gradually - 15 minutes earlier/later each night")
        
        return recommendations
    
    def fetch_recovery_data(self, departure_date: str, timezone_shift: int) -> bool:
        """Fetch and analyse recovery data."""
        travel_date = datetime.fromisoformat(departure_date)
        today = datetime.now()
        days_since_travel = (today.date() - travel_date.date()).days
        
        print(f"\n📊 Analysing {min(days_since_travel, 14)} days of data...")
        print(f"Travel date: {travel_date.strftime('%Y-%m-%d %H:%M')}")
        print(f"Days since travel: {days_since_travel}")
        
        # Baseline data point
        self.recovery_data.append({
            'day': 0,
            'date': travel_date.strftime('%Y-%m-%d'),
            'recovery_score': 100.0,
            'sleep_efficiency': self.analyser.baseline_sleep_efficiency,
            'resting_hr': self.analyser.baseline_hr,
            'temp_deviation': 0.0,
            'is_baseline': True
        })
        
        days_to_fetch = min(days_since_travel, 14)
        successful_days = 0
        
        for day in range(1, days_to_fetch + 1):
            current_date = travel_date + timedelta(days=day)
            date_str = current_date.strftime('%Y-%m-%d')
            
            print(f"  Day {day}: {date_str}", end="")
            
            # Fetch all data types with debugging
            sleep_data = self.oura_client.get_sleep_data(date_str)
            readiness_data = self.oura_client.get_readiness_data(date_str)
            resting_hr = self.oura_client.get_heartrate_data(date_str)
            
            # Try to fetch activity data (may not be available for all days)
            activity_data = None
            try:
                # Add manual activity fetch since we're adding this functionality
                target_date = datetime.strptime(date_str, '%Y-%m-%d')
                start_date = (target_date - timedelta(days=1)).strftime('%Y-%m-%d')
                end_date = (target_date + timedelta(days=1)).strftime('%Y-%m-%d')
                
                activity_response = self.oura_client.session.get(
                    f"{self.oura_client.BASE_URL}/usercollection/daily_activity",
                    params={'start_date': start_date, 'end_date': end_date}
                )
                
                if activity_response.status_code == 200:
                    activity_json = activity_response.json()
                    activity_records = activity_json.get('data', [])
                    # Find matching date
                    for record in activity_records:
                        if record.get('day', '') == date_str:
                            activity_data = record
                            active_calories = record.get('active_calories', 0)
                            training_volume = record.get('training_volume', 0)
                            print(f" [Act: {active_calories}cal, Vol: {training_volume}]", end="")
                            break
                    if not activity_data and activity_records:
                        activity_data = activity_records[0]  # Use closest
            except Exception as e:
                print(f" [Act: Error]", end="")
            
            oura_data = {
                'sleep': sleep_data,
                'readiness': readiness_data,
                'resting_hr': resting_hr,
                'activity': activity_data
            }
            
            # Calculate recovery score
            recovery_score = self.analyser.calculate_recovery_score(oura_data, timezone_shift, day)
            
            if recovery_score is not None:
                # Store debug components for the most recent successful calculation
                if hasattr(self.analyser, 'debug_components') and self.analyser.debug_components:
                    self.latest_debug_components = self.analyser.debug_components.copy()
                
                self.recovery_data.append({
                    'day': day,
                    'date': date_str,
                    'recovery_score': recovery_score,
                    'sleep_efficiency': sleep_data.get('efficiency') if sleep_data else None,
                    'resting_hr': resting_hr,
                    'temp_deviation': readiness_data.get('temperature_trend_deviation') if readiness_data else None,
                    'active_calories': activity_data.get('active_calories') if activity_data else None,
                    'training_volume': activity_data.get('training_volume') if activity_data else None,
                    'is_baseline': False,
                    'data_quality': {
                        'has_sleep': bool(sleep_data),
                        'has_readiness': bool(readiness_data),
                        'has_heartrate': bool(resting_hr),
                        'has_activity': bool(activity_data)
                    }
                })
                successful_days += 1
                print(f" ✅ Recovery: {recovery_score:.1f}%")
            else:
                print(" ❌ Insufficient data")
            
            # Rate limiting
            time.sleep(0.2)
        
        if successful_days == 0:
            print(f"\n❌ No valid Oura data found for the travel period.")
            print("Please ensure your ring was syncing during the specified dates.")
            return False
        
        print(f"\n✅ Successfully analysed {successful_days} days of data")
        return True
    
    def display_results(self, direction: str, days_since_travel: int):
        """Display analysis results and recommendations."""
        if not self.recovery_data:
            return
        
        # Get latest valid recovery score
        valid_data = [d for d in self.recovery_data if not d['is_baseline'] and d['recovery_score'] is not None]
        if not valid_data:
            print("❌ No valid recovery data to display")
            return
        
        latest = valid_data[-1]
        current_recovery = latest['recovery_score']
        
        print("\n" + "=" * 60)
        print("📈 JET LAG RECOVERY ANALYSIS")
        print("=" * 60)
        
        # Recovery status
        status_emoji = "🎯" if current_recovery >= 90 else "🔶" if current_recovery >= 70 else "🔴"
        print(f"\n{status_emoji} Current Recovery: {current_recovery:.1f}%")
        
        # Latest metrics
        print(f"\n📊 Latest Metrics (Day {latest['day']}):")
        if latest['resting_hr']:
            print(f"   ❤️  Resting HR: {latest['resting_hr']:.1f} bpm")
        if latest['sleep_efficiency']:
            print(f"   😴 Sleep Efficiency: {latest['sleep_efficiency']:.1f}%")
        if latest['temp_deviation'] is not None:
            print(f"   🌡️  Temperature Deviation: {latest['temp_deviation']:+.2f}°C")
        if latest.get('active_calories'):
            print(f"   🏃 Active Calories: {latest['active_calories']}")
        if latest.get('training_volume'):
            print(f"   💪 Training Volume: {latest['training_volume']}")
        
        # Debug component breakdown for latest day
        if hasattr(self, 'latest_debug_components'):
            print(f"\n🔍 Recovery Component Breakdown (Day {latest['day']}):")
            components = self.latest_debug_components
            
            if 'sleep_alignment' in components:
                sa = components['sleep_alignment']
                print(f"   🕐 Sleep Alignment: {sa['score']:.1f}% (40% weight)")
                print(f"      Sleep midpoint: {sa['sleep_midpoint']} | Target: {sa['target_midpoint']}")
                print(f"      Time difference: {sa['time_diff_hours']:.1f} hours")
            
            if 'hr_recovery' in components:
                hr = components['hr_recovery']
                print(f"   ❤️  Heart Rate: {hr['score']:.1f}% (25% weight)")
                print(f"      Current: {hr['current_hr']:.1f} | Baseline: {hr['baseline_hr']:.1f}")
                print(f"      Raw deviation: {hr['raw_deviation']:.1f} | Adjusted: {hr['adjusted_deviation']:.1f}")
            
            if 'activity_load' in components:
                act = components['activity_load']
                print(f"   🏃 Activity Load:")
                print(f"      Active calories: {act['active_calories']} | Training volume: {act['training_volume']}")
                print(f"      HR adjustment: +{act['hr_adjustment']} bpm allowance")
            
            if 'temp_alignment' in components:
                temp = components['temp_alignment']
                print(f"   🌡️  Temperature: {temp['score']:.1f}% (20% weight)")
                print(f"      Deviation: {temp['deviation']:+.2f}°C")
            
            if 'sleep_quality' in components:
                sq = components['sleep_quality']
                print(f"   😴 Sleep Quality: {sq['score']:.1f}% (15% weight)")
                print(f"      Efficiency: {sq['efficiency']:.1f}% | Baseline: {sq['baseline']:.1f}%")
        
        # Data quality summary
        total_days = len([d for d in self.recovery_data if not d['is_baseline']])
        sleep_days = len([d for d in valid_data if d['data_quality']['has_sleep']])
        hr_days = len([d for d in valid_data if d['data_quality']['has_heartrate']])
        readiness_days = len([d for d in valid_data if d['data_quality']['has_readiness']])
        activity_days = len([d for d in valid_data if d['data_quality']['has_activity']])
        
        print(f"\n📈 Data Quality:")
        print(f"   Total days analysed: {total_days}")
        print(f"   Sleep records: {sleep_days}")
        print(f"   Heart rate data: {hr_days}")
        print(f"   Readiness data: {readiness_days}")
        print(f"   Activity data: {activity_days}")
        
        # Recommendations
        recommendations = self.generate_recommendations(current_recovery, direction, days_since_travel)
        if recommendations:
            print(f"\n💡 Personalised Recommendations:")
            for i, rec in enumerate(recommendations, 1):
                print(f"   {i}. {rec}")
        
        # Recovery trend
        print(f"\n📉 Recovery Trend:")
        for data_point in self.recovery_data:
            if data_point['is_baseline']:
                print(f"   Day {data_point['day']:2d}: {data_point['recovery_score']:5.1f}% (Baseline)")
            elif data_point['recovery_score'] is not None:
                print(f"   Day {data_point['day']:2d}: {data_point['recovery_score']:5.1f}%")
            else:
                print(f"   Day {data_point['day']:2d}: No data")
    
    def run(self):
        """Main application execution."""
        try:
            # Get user input
            token, departure, destination, timezone_shift, direction = self.get_user_input()
            
            # Initialise Oura client
            self.oura_client = OuraAPIClient(token)
            
            # Verify API access
            if not self.oura_client.verify_endpoints():
                sys.exit(1)
            
            # Fetch and analyse data
            if not self.fetch_recovery_data(departure, timezone_shift):
                sys.exit(1)
            
            # Calculate days since travel
            travel_date = datetime.fromisoformat(departure)
            days_since_travel = (datetime.now().date() - travel_date.date()).days
            
            # Display results
            self.display_results(direction, days_since_travel)
            
        except KeyboardInterrupt:
            print("\n\n👋 Analysis cancelled by user")
            sys.exit(0)
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    tracker = JetLagTracker()
    tracker.run()