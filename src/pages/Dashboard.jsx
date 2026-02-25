import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet, Building, FileText } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

export const Dashboard = () => {
    const { transactions, invoices } = useFinance();
    const { t } = useTranslation();
    const [filterType, setFilterType] = useState('all'); // 'all', 'date', 'month', 'year'
    const [filterValue, setFilterValue] = useState('');

    const translateCategory = (cat) => t('categoryNames', { returnObjects: true })[cat] || cat;

    const filteredTransactions = useMemo(() => {
        if (filterType === 'all' || !filterValue) return transactions;

        return transactions.filter(t => {
            if (filterType === 'date') return t.date === filterValue;
            if (filterType === 'month') return t.date.startsWith(filterValue); // Format: 'YYYY-MM'
            if (filterType === 'year') return t.date.startsWith(filterValue); // Format: 'YYYY'
            return true;
        });
    }, [transactions, filterType, filterValue]);

    const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0), [filteredTransactions]);
    const totalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0), [filteredTransactions]);
    const netProfit = totalIncome - totalExpense;

    const cashBalance = useMemo(() => {
        return filteredTransactions
            .filter(t => t.paymentMethod === 'cash' || !t.paymentMethod) // Default to cash for legacy items
            .reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount), 0);
    }, [filteredTransactions]);

    const accountsReceivable = useMemo(() => {
        if (!invoices) return 0;
        return invoices.reduce((sum, inv) => {
            const total = parseFloat(inv.totalAmount) || 0;
            const paid = parseFloat(inv.paidAmount) || 0;
            return sum + (total - paid);
        }, 0);
    }, [invoices]);

    const bankBalance = useMemo(() => {
        return filteredTransactions
            .filter(t => t.paymentMethod === 'bank')
            .reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount), 0);
    }, [filteredTransactions]);

    // Simple aggregation for the chart
    const calculateChartData = () => {
        // Group transactions by date
        const grouped = filteredTransactions.reduce((acc, current) => {
            const date = current.date;
            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }
            if (current.type === 'income') {
                acc[date].income += parseFloat(current.amount);
            } else {
                acc[date].expense += parseFloat(current.amount);
            }
            return acc;
        }, {});

        // Convert to array and sort by date
        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const chartData = calculateChartData();

    const calculateCategoryData = (type) => {
        const filtered = filteredTransactions.filter(t => t.type === type);
        const grouped = filtered.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = 0;
            acc[curr.category] += parseFloat(curr.amount);
            return acc;
        }, {});
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const incomeByCategory = calculateCategoryData('income');
    const expenseByCategory = calculateCategoryData('expense');

    const maxIncomeCat = incomeByCategory.length > 0 ? incomeByCategory[0].value : 1;
    const maxExpenseCat = expenseByCategory.length > 0 ? expenseByCategory[0].value : 1;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('dashboard.title')}</h1>
                    <p className="page-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setFilterValue('');
                        }}
                        className="filter-select"
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">{t('dashboard.filterAll')}</option>
                        <option value="date">{t('dashboard.filterDate')}</option>
                        <option value="month">{t('dashboard.filterMonth')}</option>
                        <option value="year">{t('dashboard.filterYear')}</option>
                    </select>

                    {filterType === 'date' && <input type="date" className="filter-input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />}
                    {filterType === 'month' && <input type="month" className="filter-input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />}
                    {filterType === 'year' && <input type="number" className="filter-input" placeholder="YYYY" min="2000" max="2100" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} style={{ width: '120px' }} />}

                    <button className="btn btn-primary" style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'none' : 'flex' }}>
                        <Activity size={18} />
                        {t('dashboard.generateReport')}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                {/* Total Income */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.totalIncome')}</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(totalIncome)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <TrendingUp size={100} />
                    </div>
                </div>

                {/* Total Expense */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.totalExpenses')}</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(totalExpense)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <TrendingDown size={100} />
                    </div>
                </div>

                {/* Net Profit */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.netProfit')}</p>
                            <h2 className="text-gradient" style={{ fontSize: '2rem' }}>{formatCurrency(netProfit)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-glow)', color: 'var(--primary-hover)' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <DollarSign size={100} />
                    </div>
                </div>

                {/* Accounts Receivable */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.accountsReceivable')}</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(accountsReceivable)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <FileText size={100} />
                    </div>
                </div>

                {/* Cash Balance */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.cashBalance')}</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(cashBalance)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                            <Wallet size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <Wallet size={100} />
                    </div>
                </div>

                {/* Bank Balance */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('dashboard.bankBalance')}</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(bankBalance)}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                            <Building size={24} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(2)' }}>
                        <Building size={100} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>{t('dashboard.cashFlowTrend')}</h3>
                    <div style={{ width: '100%', height: 'calc(100% - 3rem)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--panel-border)', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>{t('dashboard.incomeVsExpense')}</h3>
                    <div style={{ width: '100%', height: 'calc(100% - 3rem)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--panel-border)', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="income" name={t('transactions.income')} fill="var(--success)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name={t('transactions.expense')} fill="var(--danger)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Category Breakdowns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginTop: '2.5rem'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', color: 'var(--success)' }}>{t('dashboard.incomeByCategory')}</h3>
                    {incomeByCategory.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('dashboard.noIncome')}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {incomeByCategory.map(cat => (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {translateCategory(cat.name)}
                                        </span>
                                        <span style={{ fontWeight: 500 }}>{formatCurrency(cat.value)}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: 'var(--success)', width: `${(cat.value / maxIncomeCat) * 100}%`, borderRadius: '999px', transition: 'width 1s ease-out' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', color: 'var(--danger)' }}>{t('dashboard.expensesByCategory')}</h3>
                    {expenseByCategory.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('dashboard.noExpense')}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {expenseByCategory.map(cat => (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {translateCategory(cat.name)}
                                        </span>
                                        <span style={{ fontWeight: 500 }}>{formatCurrency(cat.value)}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: 'var(--danger)', width: `${(cat.value / maxExpenseCat) * 100}%`, borderRadius: '999px', transition: 'width 1s ease-out' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
