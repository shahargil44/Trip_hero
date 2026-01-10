
export interface Activity {
  name: string;
  time: string;
  description: string; // The full paragraph content
  type: 'main' | 'option' | 'logistic' | 'food'; // To style differently
}

export interface TripDay {
  id: number;
  date: string;
  dayName: string;
  title: string;
  icon: string;
  weather: string; // Historical/Future prediction description
  minTemp?: number; // Historical/Future Min
  maxTemp?: number; // Historical/Future Max
  precipitationSum?: number; // Historical Rain Amount in mm
  currentTemp?: number; // Live "Right Now" Temp
  currentWeather?: string; // Live "Right Now" Description
  activities: Activity[];
  budget: number;
  lodging: string;
}

export interface Attraction {
  name: string;
  type: 'mountain' | 'rain' | 'city' | 'nature' | 'food';
  rainSafe: boolean;
  cost: string;
  location: string;
  tip: string;
}

export enum TabView {
  DASHBOARD = 'dashboard',
  TIMELINE = 'timeline',
  ATTRACTIONS = 'attractions',
  LOGISTICS = 'logistics',
  DOCUMENT = 'document',
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}