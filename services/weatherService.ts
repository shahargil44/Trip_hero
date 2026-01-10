import { TripDay } from '../types';

// Coordinates for key locations in the itinerary
const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
    'אזור לוצרן': { lat: 47.0502, lon: 8.3093 }, // Lucerne
    'אזור אינטרלקן': { lat: 46.6863, lon: 7.8632 }, // Interlaken
    'אזור אגם ז\'נבה': { lat: 46.4312, lon: 6.9107 }, // Montreux
    'בית': { lat: 47.3769, lon: 8.5417 }, // Zurich (Airport/End)
};

// WMO Weather interpretation codes (WMO 4677)
const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'בהיר';
    if (code >= 1 && code <= 3) return 'מעונן חלקית';
    if (code >= 45 && code <= 48) return 'ערפל';
    if (code >= 51 && code <= 55) return 'טיפטוף';
    if (code >= 61 && code <= 67) return 'גשם';
    if (code >= 71 && code <= 77) return 'שלג';
    if (code >= 80 && code <= 82) return 'ממטרים';
    if (code >= 95) return 'סופת רעמים';
    return 'נאה';
};

export const fetchRealTimeWeather = async (days: TripDay[]): Promise<TripDay[]> => {
    const updatedDays = [...days];
    const locationsToFetch = Array.from(new Set(days.map(d => d.lodging)));

    // Map: Location -> Date (DD/MM) -> Data
    // We also store "current" live data per location separately
    const historyMap: Record<string, Record<string, { desc: string, min: number, max: number, rain: number }>> = {};
    const liveMap: Record<string, { temp: number, desc: string }> = {};

    // Reference dates for history (July 2024 as proxy for July 2025/2026)
    const START_DATE = '2024-07-01';
    const END_DATE = '2024-07-08';

    try {
        const promises = locationsToFetch.map(async (location) => {
            const coords = LOCATION_COORDS[location];
            if (!coords) return;

            // 1. Fetch Historical Data (Archive) for Future Prediction
            // Added precipitation_sum
            const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${START_DATE}&end_date=${END_DATE}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`;
            
            // 2. Fetch Current Live Data
            const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=auto`;

            const [histRes, currRes] = await Promise.all([
                fetch(historyUrl),
                fetch(currentUrl)
            ]);

            const histData = await histRes.json();
            const currData = await currRes.json();
            
            // Process Historical Data
            if (histData && histData.daily) {
                historyMap[location] = {};
                histData.daily.time.forEach((dateStr: string, index: number) => {
                    const [year, month, day] = dateStr.split('-');
                    const formattedDate = `${day}/${month}`; 
                    historyMap[location][formattedDate] = {
                        desc: getWeatherDescription(histData.daily.weathercode[index]),
                        min: Math.round(histData.daily.temperature_2m_min[index]),
                        max: Math.round(histData.daily.temperature_2m_max[index]),
                        rain: histData.daily.precipitation_sum[index] || 0
                    };
                });
            }

            // Process Live Data
            if (currData && currData.current) {
                liveMap[location] = {
                    temp: Math.round(currData.current.temperature_2m),
                    desc: getWeatherDescription(currData.current.weather_code)
                };
            }
        });

        await Promise.all(promises);

        return updatedDays.map(day => {
            // Merge Historical Prediction
            const histLoc = historyMap[day.lodging];
            const liveLoc = liveMap[day.lodging];
            
            let updatedDay = { ...day };

            if (histLoc && histLoc[day.date]) {
                const dayData = histLoc[day.date];
                updatedDay.weather = dayData.desc;
                updatedDay.minTemp = dayData.min;
                updatedDay.maxTemp = dayData.max;
                updatedDay.precipitationSum = dayData.rain;
            }

            if (liveLoc) {
                updatedDay.currentTemp = liveLoc.temp;
                updatedDay.currentWeather = liveLoc.desc;
            }

            return updatedDay;
        });

    } catch (error) {
        console.error("Failed to fetch weather:", error);
        return days;
    }
};