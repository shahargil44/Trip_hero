import React, { useState, useEffect } from 'react';
import { TRIP_DAYS, ATTRACTIONS } from './constants';
import { TabView, TripDay, Activity } from './types';
import { AIChatModal } from './components/AIChatModal';
import { TripMixChart, BudgetChart } from './components/StatsCharts';
import { fetchRealTimeWeather } from './services/weatherService';

// Sub-component for an expandable activity item
const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Style based on type
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'option': return 'border-l-4 border-orange-400 bg-orange-50/50';
            case 'logistic': return 'border-l-4 border-slate-300 bg-slate-50';
            case 'food': return 'border-l-4 border-purple-400 bg-purple-50/50';
            default: return 'border-l-4 border-blue-500 bg-white';
        }
    };

    return (
        <div className={`mb-3 rounded-r-lg shadow-sm transition-all ${getTypeStyles(activity.type)}`}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 cursor-pointer flex justify-between items-start hover:bg-black/5 transition-colors"
            >
                <div className="flex gap-3">
                    <span className="font-mono font-bold text-slate-500 w-12 shrink-0 pt-0.5 text-sm">{activity.time}</span>
                    <div>
                        <h4 className={`font-bold text-sm sm:text-base leading-tight ${activity.type === 'option' ? 'text-orange-800' : 'text-slate-800'} ${isOpen ? 'text-blue-700 underline' : ''}`}>
                            {activity.name}
                        </h4>
                        {!isOpen && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {activity.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">
                    {isOpen ? 'סגור ▲' : 'קרא עוד ▼'}
                </div>
            </div>
            
            {isOpen && (
                <div className="px-3 pb-3 pt-0 animate-fade-in pl-16">
                    <p className="text-sm text-slate-700 leading-relaxed border-t border-black/5 pt-2">
                        {activity.description}
                    </p>
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [days, setDays] = useState<TripDay[]>(TRIP_DAYS);
    const [currentTab, setCurrentTab] = useState<TabView>(TabView.DASHBOARD);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiContextDay, setAiContextDay] = useState<TripDay | null>(null);
    const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
    const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
    const [attractionFilter, setAttractionFilter] = useState<'all' | 'rain' | 'mountain'>('all');
    
    // New state for Dashboard Day Selection
    const [dashboardDayId, setDashboardDayId] = useState<number>(1);

    // Fetch real-time weather on mount
    useEffect(() => {
        const loadWeather = async () => {
            const updatedDays = await fetchRealTimeWeather(TRIP_DAYS);
            setDays(updatedDays);
        };
        loadWeather();
    }, []);

    const handleOpenAI = (type: 'general' | 'day' | 'food', dayId?: number) => {
        setAiContextDay(null);
        setAiInitialQuery('');

        if (type === 'day' && dayId) {
            const day = days.find(d => d.id === dayId);
            if (day) {
                setAiContextDay(day);
                setAiInitialQuery(`אני רוצה לנתח את היום ה-${dayId} בטיול. התחזית הצפויה היא ${day.weather} (טמפ' ${day.minTemp}-${day.maxTemp}). האם יש לך טיפים או המלצות?`);
            }
        } else if (type === 'food') {
            setAiInitialQuery("אני מחפש המלצה לאוכל טוב וזול שמתאים למשפחות באזור שוויץ, קרוב למסלול שלנו.");
        }
        
        setIsAIModalOpen(true);
    };

    const toggleRainMode = () => {
        setAttractionFilter('rain');
        setCurrentTab(TabView.ATTRACTIONS);
    };

    const getRainRiskLabel = (mm: number) => {
        if (mm === 0) return 'אפסי';
        if (mm < 2) return 'נמוך';
        if (mm < 10) return 'בינוני';
        return 'גבוה!';
    };

    const getRainRiskColor = (mm: number) => {
        if (mm === 0) return 'text-slate-400';
        if (mm < 2) return 'text-blue-400';
        if (mm < 10) return 'text-blue-600';
        return 'text-blue-800 font-bold';
    };

    const renderDashboard = () => {
        // Find the selected day for the dashboard view
        const currentDay = days.find(d => d.id === dashboardDayId) || days[0];
        
        return (
            <div className="animate-fade-in space-y-6">
                <div className="mb-2">
                    <h2 className="text-xl font-bold text-slate-800">מבט על</h2>
                    <p className="text-sm text-slate-600">סיכום סטטוס לטיול יולי. בחרו יום להצגת נתונים:</p>
                </div>

                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setDashboardDayId(day.id)}
                            className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl border transition-all ${
                                dashboardDayId === day.id 
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-105' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold">יום {day.id}</span>
                            <span className="text-xs">{day.date}</span>
                        </button>
                    ))}
                </div>

                {/* Highlight Card (Linked to dashboardDayId) */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-300 text-xs uppercase tracking-wider mb-1">
                                תכנון ליום {currentDay.id} ({currentDay.dayName})
                            </p>
                            <h3 className="text-2xl font-bold mb-1 leading-tight">{currentDay.title}</h3>
                            <p className="text-sm text-slate-300 flex items-center gap-1">📍 {currentDay.lodging}</p>
                        </div>
                        <div className="text-4xl filter drop-shadow-md bg-white/10 p-2 rounded-full">{currentDay.icon}</div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="mt-6 flex gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-3 text-center flex-1 flex flex-col justify-center">
                            <span className="block text-[10px] text-slate-300 mb-1">פעילות ראשונה</span>
                            <span className="font-bold text-sm leading-none">
                                {currentDay.activities[0]?.time || '--:--'}
                            </span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-3 text-center flex-1 flex flex-col justify-center">
                            <span className="block text-[10px] text-slate-300 mb-1">עומס צפוי</span>
                            <span className="font-bold text-sm text-red-300 leading-none">בינוני-גבוה</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-2 text-center flex-1 flex flex-col justify-center items-center">
                            <span className="block text-[10px] text-slate-300 mb-1">מזג אוויר</span>
                            <span className="font-bold text-xs whitespace-nowrap leading-none mb-1">
                                {currentDay.weather.split(' ')[0]}
                            </span>
                             {/* Mini High/Low display inside the card */}
                             {currentDay.minTemp !== undefined && currentDay.maxTemp !== undefined ? (
                                <div className="flex gap-2 text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-full mt-1">
                                    <span className="text-red-300 flex items-center">↑{currentDay.maxTemp}°</span>
                                    <span className="text-blue-300 flex items-center">↓{currentDay.minTemp}°</span>
                                </div>
                            ) : (
                                <span className="text-[10px] opacity-70">טוען...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={toggleRainMode} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-slate-50">
                        <span className="text-2xl">☔</span>
                        <span className="text-sm font-bold text-slate-700">מצב גשם</span>
                        <span className="text-xs text-slate-400 text-center">לחץ לחלופות מקורות</span>
                    </button>
                    <button onClick={() => handleOpenAI('food')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50">
                        <span className="text-2xl">🍽️</span>
                        <span className="text-sm font-bold text-slate-700">רעבים?</span>
                        <span className="text-xs text-purple-600 text-center font-bold">שאל את Gemini ✨</span>
                    </button>
                </div>

                {/* Chart */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span>📊</span> תמהיל הטיול
                    </h3>
                    <TripMixChart />
                    <p className="text-xs text-center text-slate-400 mt-2">חלוקת סוגי פעילויות לאורך 8 ימי הטיול</p>
                </div>
            </div>
        );
    };

    const renderTimeline = () => (
        <div className="animate-fade-in space-y-4 pb-4">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800">לו"ז מבצעי: 1-8 ביולי</h2>
                <p className="text-sm text-slate-600">לחץ על פעילות כדי לקרוא את הפירוט המלא מתוך תוכנית הטיול.</p>
            </div>

            {days.map((day) => (
                <div key={day.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4">
                        <div 
                            className="flex justify-between items-center cursor-pointer" 
                            onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 rounded-lg p-2 w-12 text-center shrink-0">
                                    <span className="block text-xs font-bold text-slate-500">{day.date}</span>
                                    <span className="block text-lg">{day.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">{day.title}</h3>
                                    <p className="text-xs text-slate-500">{day.dayName} | {day.lodging}</p>
                                </div>
                            </div>
                            <div className={`text-slate-400 transition-transform ${expandedDayId === day.id ? 'rotate-180' : ''}`}>▼</div>
                        </div>

                        {/* AI Button */}
                        <div className="mt-3 flex justify-end">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAI('day', day.id);
                                }}
                                className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-100 transition-colors border border-purple-100"
                            >
                                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                נתח יום עם AI
                            </button>
                        </div>
                    </div>

                    {expandedDayId === day.id && (
                        <div className="bg-slate-50 border-t border-slate-100 p-4 animate-fade-in">
                            {/* Weather Header */}
                            <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                                <div className="bg-blue-50 border border-blue-100 px-2 py-1 rounded flex items-center gap-2 shadow-sm">
                                    <span className="text-slate-500">צפי גשם (2026):</span>
                                    {day.precipitationSum !== undefined ? (
                                        <div className={`flex items-center gap-1 font-bold ${getRainRiskColor(day.precipitationSum)}`}>
                                            <span className="material-symbols-outlined text-[14px]">water_drop</span>
                                            <span>{day.precipitationSum} מ"מ</span>
                                            <span className="text-[10px] font-normal text-slate-600 bg-white/50 px-1 rounded">
                                                ({getRainRiskLabel(day.precipitationSum)})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">טוען...</span>
                                    )}
                                </div>
                                {day.currentTemp !== undefined && (
                                    <div className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex gap-2 items-center shadow-sm">
                                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE: {day.currentTemp}°
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Activity List */}
                            <div className="space-y-1">
                                {day.activities.map((act, idx) => (
                                    <ActivityItem key={idx} activity={act} />
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                                <span className="font-bold text-slate-700 text-sm bg-yellow-50 px-2 py-1 rounded">תקציב משוער: {day.budget} CHF</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderAttractions = () => {
        const filtered = attractionFilter === 'all' 
            ? ATTRACTIONS 
            : ATTRACTIONS.filter(a => attractionFilter === 'rain' ? a.rainSafe : a.type === 'mountain');

        return (
            <div className="animate-fade-in pb-4">
                 <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-800">בנק מטרות</h2>
                    <p className="text-sm text-slate-600">סינון אטרקציות לפי התאמה</p>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
                    <button onClick={() => setAttractionFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${attractionFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>הכל</button>
                    <button onClick={() => setAttractionFilter('rain')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${attractionFilter === 'rain' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>🌧️ מתאים לגשם</button>
                    <button onClick={() => setAttractionFilter('mountain')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${attractionFilter === 'mountain' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>🏔️ הרים</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((att, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{att.name}</h4>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${att.rainSafe ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {att.rainSafe ? 'מתאים לגשם' : 'חוץ בלבד'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {att.location}
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.name + ' ' + att.location)}`, '_blank')}
                                        className="text-blue-500 text-xs hover:underline mr-1 font-bold"
                                        title="פתח במפות גוגל"
                                    >
                                        (פתח מפה)
                                    </button>
                                </p>
                                <p className="text-xs text-slate-400 mb-3">💰 עלות: {att.cost}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mt-2 border border-slate-100">
                                💡 {att.tip}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLogistics = () => (
        <div className="animate-fade-in space-y-6">
             <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800">ניהול לוגיסטי</h2>
                <p className="text-sm text-slate-600">חישוב עלויות וכרטיסי הנחה.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">הערכת תקציב יומית (CHF)</h3>
                <BudgetChart />
            </div>

             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">train</span>
                    אסטרטגיית כרטיסים
                </h4>
                <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                    <li><strong>מבוגרים (2):</strong> Swiss Half Fare Card (חצי מחיר).</li>
                    <li><strong>נערה (16):</strong> כרטיס מבוגר + Half Fare (חצי מחיר).</li>
                    <li><strong>ילדה (11):</strong> Family Card (חינם לגמרי בליווי הורים).</li>
                </ul>
            </div>
        </div>
    );

    const renderFullDocument = () => (
        <div className="animate-fade-in bg-white p-8 sm:p-12 shadow-md rounded-xl max-w-4xl mx-auto print:shadow-none print:p-0">
            <div className="flex justify-between items-start mb-8 print:mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">שוויץ 2025: תוכנית טיול מלאה</h1>
                    <p className="text-slate-500">מסמך מקור | 1-8 ביולי 2025</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-700 transition-colors print:hidden"
                >
                    <span className="material-symbols-outlined text-lg">print</span>
                    הדפסה / שמירה כ-PDF
                </button>
            </div>

            {/* Logistics Summary in Doc */}
            <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200 print:bg-white print:border print:border-slate-300">
                <h2 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">לוגיסטיקה וכרטיסים</h2>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                    <li><strong>מבוגרים (2):</strong> Swiss Half Fare Card (חצי מחיר).</li>
                    <li><strong>נערה (16):</strong> כרטיס מבוגר + Half Fare (חצי מחיר).</li>
                    <li><strong>ילדה (11):</strong> Family Card (חינם לגמרי בליווי הורים).</li>
                </ul>
            </div>

            {/* Days Loop */}
            <div className="space-y-8">
                {days.map(day => (
                    <div key={day.id} className="break-inside-avoid">
                        <div className="flex items-center gap-3 mb-3 border-b-2 border-slate-100 pb-2">
                            <span className="text-2xl">{day.icon}</span>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">יום {day.id}: {day.title}</h3>
                                <p className="text-sm text-slate-500">{day.dayName}, {day.date} | לינה: {day.lodging}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pr-4">
                            {day.activities.map((act, idx) => (
                                <div key={idx} className="relative pr-4 border-r-2 border-slate-200">
                                    <div className="absolute -right-[5px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-mono font-bold text-slate-600 text-sm">{act.time}</span>
                                        <span className={`font-bold ${act.type === 'option' ? 'text-orange-700' : 'text-slate-800'}`}>
                                            {act.name} {act.type === 'option' ? '(אופציה)' : ''}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed text-justify">
                                        {act.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 print:mt-8">
                <p>הופק באמצעות Swiss Trip Dashboard 2025</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 font-sans" dir="rtl">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white z-40 shadow-sm border-b border-slate-200 print:hidden">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🇨🇭</span>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-slate-800">שוויץ 2025</h1>
                            <p className="text-[10px] text-slate-500 font-medium">1-8 ביולי | המדריך המבצעי</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenAI('general')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        יועץ AI
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex justify-around bg-white text-sm border-t border-slate-100 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setCurrentTab(TabView.DASHBOARD)}
                        className={`flex-1 py-3 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${currentTab === TabView.DASHBOARD ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-slate-500'}`}
                    >
                        דשבורד
                    </button>
                    <button 
                        onClick={() => setCurrentTab(TabView.TIMELINE)}
                        className={`flex-1 py-3 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${currentTab === TabView.TIMELINE ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-slate-500'}`}
                    >
                        לו"ז מלא
                    </button>
                    <button 
                        onClick={() => setCurrentTab(TabView.ATTRACTIONS)}
                        className={`flex-1 py-3 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${currentTab === TabView.ATTRACTIONS ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-slate-500'}`}
                    >
                        אטרקציות
                    </button>
                    <button 
                        onClick={() => setCurrentTab(TabView.LOGISTICS)}
                        className={`flex-1 py-3 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${currentTab === TabView.LOGISTICS ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-slate-500'}`}
                    >
                        לוגיסטיקה
                    </button>
                     <button 
                        onClick={() => setCurrentTab(TabView.DOCUMENT)}
                        className={`flex-1 py-3 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${currentTab === TabView.DOCUMENT ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-slate-500'}`}
                    >
                        מסמך מלא
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto mt-32 px-4 print:mt-0 print:max-w-none">
                {currentTab === TabView.DASHBOARD && renderDashboard()}
                {currentTab === TabView.TIMELINE && renderTimeline()}
                {currentTab === TabView.ATTRACTIONS && renderAttractions()}
                {currentTab === TabView.LOGISTICS && renderLogistics()}
                {currentTab === TabView.DOCUMENT && renderFullDocument()}
            </main>

            <AIChatModal 
                isOpen={isAIModalOpen} 
                onClose={() => setIsAIModalOpen(false)} 
                dayContext={aiContextDay}
                initialQuery={aiInitialQuery}
            />
        </div>
    );
};

export default App;