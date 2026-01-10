import React from 'react';
import { Doughnut } from 'react-chartjs-2'; // Wait, instructions said Recharts. Recharts doesn't have Doughnut in the same way, using Pie.
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TRIP_DAYS } from '../constants';

const TRIP_MIX_DATA = [
    { name: 'הרים', value: 40, color: '#10b981' },
    { name: 'ערים', value: 25, color: '#f59e0b' },
    { name: 'מים', value: 15, color: '#3b82f6' },
    { name: 'נוף', value: 20, color: '#6366f1' },
];

const BUDGET_DATA = TRIP_DAYS.map(day => ({
    name: day.date,
    amount: day.budget
}));

export const TripMixChart: React.FC = () => {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={TRIP_MIX_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {TRIP_MIX_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const BudgetChart: React.FC = () => {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BUDGET_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="F" />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};