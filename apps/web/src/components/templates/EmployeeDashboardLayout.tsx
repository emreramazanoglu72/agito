import React from 'react';
import { Users, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatWidgetProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: {
        value: string;
        positive: boolean;
    };
}

const StatWidget: React.FC<StatWidgetProps> = ({ label, value, icon: Icon, trend }) => (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                {trend && (
                    <span className={cn(
                        "text-xs font-semibold",
                        trend.positive ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {trend.positive ? '+' : ''}{trend.value}
                    </span>
                )}
            </div>
        </div>
    </div>
);

interface EmployeeDashboardLayoutProps {
    children: React.ReactNode;
    stats: {
        totalEmployees: number;
        departments: number;
        activePolicies: number;
    };
    header: React.ReactNode;
}

export const EmployeeDashboardLayout: React.FC<EmployeeDashboardLayoutProps> = ({
    children,
    stats,
    header
}) => {
    return (
        <div className="flex flex-col gap-8">
            <section className="relative overflow-hidden rounded-[40px] bg-[radial-gradient(120%_120%_at_10%_15%,_#0f766e_0%,_#0b1220_55%,_#0a0f1c_100%)] p-8 text-white shadow-2xl shadow-teal-900/20">
                <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-teal-300/10 blur-[100px]"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]"></div>

                <div className="relative z-10">
                    {header}
                </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatWidget
                    label="Toplam Çalışan"
                    value={stats.totalEmployees}
                    icon={Users}
                    trend={{ value: '12%', positive: true }}
                />
                <StatWidget
                    label="Departmanlar"
                    value={stats.departments}
                    icon={Briefcase}
                />
                <StatWidget
                    label="Aktif Poliçeler"
                    value={stats.activePolicies}
                    icon={ShieldCheck}
                    trend={{ value: '5%', positive: true }}
                />
            </div>

            <div className="relative min-h-[500px]">
                {children}
            </div>
        </div>
    );
};
