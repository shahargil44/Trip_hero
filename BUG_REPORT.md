# דוח באגים - Swiss Trip Dashboard 2025

**תאריך:** 29 בינואר 2026
**גרסה:** מצב נוכחי של הפרויקט

---

## סיכום מנהלים

נמצאו **17 באגים** באפליקציה, מתוכם:
- 🔴 **קריטי (Security):** 1
- 🟠 **גבוה:** 5
- 🟡 **בינוני:** 6
- 🟢 **נמוך:** 5

---

## באגים קריטיים 🔴

### באג #1: פגיעות XSS (Cross-Site Scripting)
**קובץ:** `components/AIChatModal.tsx` שורה 107
**חומרה:** קריטית 🔴

**תיאור:**
שימוש ב-`dangerouslySetInnerHTML` ללא סניטציה של הקלט. הודעות מהמשתמש או מה-API מוכנסות ישירות ל-DOM.

**קוד בעייתי:**
```tsx
<div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
```

**סיכון:**
תוקף יכול להזריק קוד JavaScript זדוני דרך הצ'אט או דרך תגובות ה-AI.

**תיקון מומלץ:**
```tsx
// התקנת ספריית סניטציה
// npm install dompurify @types/dompurify

import DOMPurify from 'dompurify';

// בתוך הקומפוננט
const sanitizeAndFormat = (text: string) => {
    const formatted = text
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    return DOMPurify.sanitize(formatted);
};

// בשימוש
<div dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(msg.text) }} />
```

---

## באגים בעדיפות גבוהה 🟠

### באג #2: מפתח API לא תואם
**קובץ:** `services/geminiService.ts` שורה 6
**חומרה:** גבוהה 🟠

**תיאור:**
השירות מחפש את `process.env.API_KEY` אבל לפי ה-vite.config.ts וה-README, המפתח אמור להיות `GEMINI_API_KEY`.

**קוד בעייתי:**
```ts
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
```

**תיקון מומלץ:**
```ts
const getClient = () => {
    // ב-Vite, משתני סביבה צריכים להתחיל ב-VITE_
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("API Key is missing. Set VITE_GEMINI_API_KEY in .env.local");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};
```

וב-`.env.local`:
```
VITE_GEMINI_API_KEY=your_key_here
```

---

### באג #3: היסטוריית צ'אט לא נשלחת ל-AI
**קובץ:** `services/geminiService.ts` שורה 17
**חומרה:** גבוהה 🟠

**תיאור:**
הפרמטר `chatHistory` מוגדר בפונקציה אבל לא נעשה בו שימוש. המשמעות היא שה-AI לא מקבל את ההקשר של השיחה.

**קוד בעייתי:**
```ts
export const generateConciergeResponse = async (
    userPrompt: string,
    chatHistory: { role: string, text: string }[], // לא נעשה שימוש!
    currentTripContext?: TripDay
): Promise<string> => {
```

**תיקון מומלץ:**
```ts
export const generateConciergeResponse = async (
    userPrompt: string,
    chatHistory: { role: string, text: string }[],
    currentTripContext?: TripDay
): Promise<string> => {
    const client = getClient();
    if (!client) return "שגיאה: חסר מפתח API.";

    // המרת היסטוריה לפורמט של Gemini
    const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    try {
        const chat = client.chats.create({
            model: 'gemini-2.0-flash',
            systemInstruction: systemInstruction,
            history: formattedHistory
        });

        const response = await chat.sendMessage(fullPrompt);
        return response.text || "לא הצלחתי לייצר תשובה כרגע.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "מצטער, נתקלתי בבעיה בתקשורת.";
    }
};
```

---

### באג #4: שליחה כפולה של הודעה ראשונית
**קובץ:** `components/AIChatModal.tsx` שורות 26-31
**חומרה:** גבוהה 🟠

**תיאור:**
ה-`useEffect` שולח את ה-`initialQuery` בכל פעם שהמודאל נפתח או שה-query משתנה. אם המשתמש לוחץ מהר על "נתח יום עם AI" על אותו יום, ההודעה נשלחת פעמיים.

**קוד בעייתי:**
```tsx
useEffect(() => {
    if (isOpen && initialQuery) {
        handleSend(initialQuery);
    }
}, [isOpen, initialQuery]);
```

**תיקון מומלץ:**
```tsx
const [hasHandledInitialQuery, setHasHandledInitialQuery] = useState(false);

useEffect(() => {
    if (isOpen && initialQuery && !hasHandledInitialQuery) {
        handleSend(initialQuery);
        setHasHandledInitialQuery(true);
    }

    if (!isOpen) {
        setHasHandledInitialQuery(false);
    }
}, [isOpen, initialQuery, hasHandledInitialQuery]);
```

---

### באג #5: היסטוריית צ'אט לא מתאפסת
**קובץ:** `components/AIChatModal.tsx`
**חומרה:** גבוהה 🟠

**תיאור:**
כשסוגרים את המודאל ופותחים מחדש, היסטוריית השיחה נשארת. זה יכול לבלבל משתמשים ולצרוך זיכרון מיותר.

**תיקון מומלץ:**
```tsx
// הוספת useEffect לאיפוס כשהמודאל נסגר
useEffect(() => {
    if (!isOpen) {
        setMessages([{
            id: 'welcome',
            text: 'היי! אני העוזר החכם לטיול שוויץ 2025. איך אפשר לעזור היום?',
            sender: 'bot',
            timestamp: Date.now()
        }]);
        setInput('');
    }
}, [isOpen]);
```

---

### באג #6: חוסר פידבק למשתמש בשגיאת API
**קובץ:** `components/AIChatModal.tsx` שורות 67-69
**חומרה:** גבוהה 🟠

**תיאור:**
כששליחת ההודעה נכשלת, השגיאה רק נרשמת לקונסול והמשתמש לא רואה כלום.

**קוד בעייתי:**
```tsx
} catch (error) {
    console.error(error);
} finally {
```

**תיקון מומלץ:**
```tsx
} catch (error) {
    console.error(error);
    const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ מצטער, לא הצלחתי לעבד את הבקשה. נסה שוב.',
        sender: 'bot',
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, errorMsg]);
} finally {
```

---

## באגים בעדיפות בינונית 🟡

### באג #7: יחידת מידה שגויה בגרף
**קובץ:** `components/StatsCharts.tsx` שורה 54
**חומרה:** בינונית 🟡

**תיאור:**
ציר ה-Y מציג "F" (פרנהייט) במקום "CHF" (פרנק שוויצרי).

**קוד בעייתי:**
```tsx
<YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="F" />
```

**תיקון מומלץ:**
```tsx
<YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit=" CHF" />
```

---

### באג #8: אי-התאמה בשנים
**קבצים:** `App.tsx` שורות 260, 381-382, 449-450
**חומרה:** בינונית 🟡

**תיאור:**
האפליקציה מציגה מידע סותר:
- בכותרת: "שוויץ 2025"
- בתצוגת מזג אוויר: "צפי גשם (2026)"
- במסמך המלא: "1-8 ביולי 2025"

**תיקון מומלץ:**
להחליט על שנה אחת (2025 או 2026) ולעדכן את כל המקומות בהתאם.

---

### באג #9: ייבוא לא בשימוש
**קובץ:** `components/StatsCharts.tsx` שורה 2
**חומרה:** בינונית 🟡

**תיאור:**
`Doughnut` מיובא מ-`react-chartjs-2` אבל לא נעשה בו שימוש.

**קוד בעייתי:**
```tsx
import { Doughnut } from 'react-chartjs-2';
```

**תיקון מומלץ:**
למחוק את השורה.

---

### באג #10: Memory Leak פוטנציאלי ב-useEffect
**קובץ:** `App.tsx` שורות 70-76
**חומרה:** בינונית 🟡

**תיאור:**
ה-`useEffect` שטוען מזג אוויר לא כולל cleanup function. אם הקומפוננט מתבטל לפני שהקריאה מסתיימת, יתבצע ניסיון לעדכן state של קומפוננט שכבר לא קיים.

**קוד בעייתי:**
```tsx
useEffect(() => {
    const loadWeather = async () => {
        const updatedDays = await fetchRealTimeWeather(TRIP_DAYS);
        setDays(updatedDays);
    };
    loadWeather();
}, []);
```

**תיקון מומלץ:**
```tsx
useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
        const updatedDays = await fetchRealTimeWeather(TRIP_DAYS);
        if (isMounted) {
            setDays(updatedDays);
        }
    };
    loadWeather();

    return () => {
        isMounted = false;
    };
}, []);
```

---

### באג #11: שימוש ב-index כ-key
**קובץ:** `App.tsx` שורות 285-286, 319, 416
**חומרה:** בינונית 🟡

**תיאור:**
שימוש ב-`key={idx}` במקום מזהה ייחודי יכול לגרום לבעיות רינדור אם הרשימה משתנה.

**קוד בעייתי:**
```tsx
{day.activities.map((act, idx) => (
    <ActivityItem key={idx} activity={act} />
))}
```

**תיקון מומלץ:**
```tsx
{day.activities.map((act) => (
    <ActivityItem key={`${day.id}-${act.time}-${act.name}`} activity={act} />
))}
```

---

### באג #12: גישה לאלמנט לא קיים במערך
**קובץ:** `App.tsx` שורה 116
**חומרה:** בינונית 🟡

**תיאור:**
אם מערך `days` ריק, `days[0]` יחזיר `undefined`.

**קוד בעייתי:**
```tsx
const currentDay = days.find(d => d.id === dashboardDayId) || days[0];
```

**תיקון מומלץ:**
```tsx
const currentDay = days.find(d => d.id === dashboardDayId) ?? days[0];
if (!currentDay) {
    return <div className="text-center p-8">טוען נתונים...</div>;
}
```

---

## באגים בעדיפות נמוכה 🟢

### באג #13: שם מודל AI לא נכון
**קובץ:** `services/geminiService.ts` שורה 54
**חומרה:** נמוכה 🟢

**תיאור:**
שם המודל `gemini-3-flash-preview` לא קיים. המודלים הזמינים הם `gemini-2.0-flash`, `gemini-1.5-pro` וכו'.

**תיקון מומלץ:**
```tsx
const model = 'gemini-2.0-flash';
```

---

### באג #14: תאריכי היסטוריה מזג אוויר קבועים
**קובץ:** `services/weatherService.ts` שורות 34-35
**חומרה:** נמוכה 🟢

**תיאור:**
תאריכי 2024 קבועים בקוד ללא הסבר או דינמיות.

**קוד בעייתי:**
```ts
const START_DATE = '2024-07-01';
const END_DATE = '2024-07-08';
```

**תיקון מומלץ:**
```ts
// שימוש בשנה שעברה כפרוקסי לתחזית (נתונים היסטוריים זהים יותר מתחזית רחוקה)
const currentYear = new Date().getFullYear();
const historicalYear = currentYear - 1;
const START_DATE = `${historicalYear}-07-01`;
const END_DATE = `${historicalYear}-07-08`;
```

---

### באג #15: שגיאת כתיב בעברית
**קובץ:** `App.tsx` שורה 192
**חומרה:** נמוכה 🟢

**תיאור:**
הטקסט "לחץ לחלופות מקורות" לא ברור - כנראה צריך להיות "לחץ לחלופות מקורות" (חלופות מקורות) או "לחץ לחלופות במקרה של גשם".

**תיקון מומלץ:**
```tsx
<span className="text-xs text-slate-400 text-center">לחץ לחלופות ליום גשום</span>
```

---

### באג #16: חוסר נגישות (Accessibility)
**קבצים:** `App.tsx`, `AIChatModal.tsx`
**חומרה:** נמוכה 🟢

**תיאור:**
- כפתורים חסרים `aria-label`
- המודאל לא לוכד פוקוס
- אין תמיכה בניווט מקלדת מלא

**תיקון מומלץ:**
```tsx
// לדוגמה
<button
    onClick={onClose}
    aria-label="סגור חלון צ'אט"
    className="..."
>
```

---

### באג #17: קוד WMO חסר
**קובץ:** `services/weatherService.ts` שורות 11-22
**חומרה:** נמוכה 🟢

**תיאור:**
פונקציית `getWeatherDescription` לא מכסה את כל קודי WMO. קודים כמו 56-57 (Freezing drizzle), 66 (Freezing rain) חסרים.

**תיקון מומלץ:**
```ts
const getWeatherDescription = (code: number): string => {
    const descriptions: Record<number, string> = {
        0: 'בהיר',
        1: 'בהיר בעיקר',
        2: 'מעונן חלקית',
        3: 'מעונן',
        45: 'ערפל',
        48: 'ערפל קופא',
        51: 'טיפטוף קל',
        53: 'טיפטוף',
        55: 'טיפטוף כבד',
        56: 'טיפטוף קופא קל',
        57: 'טיפטוף קופא',
        61: 'גשם קל',
        63: 'גשם',
        65: 'גשם כבד',
        66: 'גשם קופא קל',
        67: 'גשם קופא',
        71: 'שלג קל',
        73: 'שלג',
        75: 'שלג כבד',
        77: 'גרגירי שלג',
        80: 'ממטרים קלים',
        81: 'ממטרים',
        82: 'ממטרים כבדים',
        85: 'שלג ממטרים קלים',
        86: 'שלג ממטרים כבדים',
        95: 'סופת רעמים',
        96: 'סופת רעמים עם ברד קל',
        99: 'סופת רעמים עם ברד'
    };
    return descriptions[code] || 'נאה';
};
```

---

## סיכום עדיפויות לתיקון

| עדיפות | באג # | תיאור קצר | זמן משוער |
|--------|-------|-----------|----------|
| 🔴 | 1 | XSS Vulnerability | 30 דקות |
| 🟠 | 2 | API Key mismatch | 15 דקות |
| 🟠 | 3 | Chat history not sent | 45 דקות |
| 🟠 | 4 | Double message send | 20 דקות |
| 🟠 | 5 | Chat not resetting | 10 דקות |
| 🟠 | 6 | No error feedback | 15 דקות |
| 🟡 | 7 | Wrong unit in chart | 5 דקות |
| 🟡 | 8 | Year inconsistency | 10 דקות |
| 🟡 | 9 | Unused import | 2 דקות |
| 🟡 | 10 | Memory leak | 10 דקות |
| 🟡 | 11 | Index as key | 15 דקות |
| 🟡 | 12 | Undefined access | 10 דקות |
| 🟢 | 13 | Wrong model name | 2 דקות |
| 🟢 | 14 | Hardcoded dates | 10 דקות |
| 🟢 | 15 | Hebrew typo | 2 דקות |
| 🟢 | 16 | Accessibility | 1+ שעה |
| 🟢 | 17 | Missing WMO codes | 15 דקות |

---

## המלצות נוספות

1. **הוספת בדיקות (Tests):** אין בדיקות אוטומטיות בפרויקט.
2. **Error Boundary:** מומלץ להוסיף React Error Boundary לתפיסת שגיאות.
3. **Loading States:** כדאי להוסיף מצבי טעינה גלובליים.
4. **TypeScript Strict Mode:** מומלץ להפעיל `strict: true` ב-tsconfig.

---

*דוח זה נוצר אוטומטית ע"י Claude Code*
