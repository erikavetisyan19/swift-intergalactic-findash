import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, Calculator, Plus, Trash2, Edit2, Save, Send, Check, X, Calendar } from 'lucide-react';
import { FinanceContext } from '../context/FinanceContext';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const Payroll = () => {
    const { t } = useTranslation();
    const { userRole } = useAuth();
    const { employees, timeLogs, addEmployee, updateEmployee, deleteEmployee, addTimeLog, deleteTimeLog } = useContext(FinanceContext);
    const [activeTab, setActiveTab] = useState('time'); // 'time', 'salary', 'employees'

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t('payroll.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('payroll.subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="segment-control" style={{ maxWidth: '100%', flexWrap: 'wrap' }}>
                    <button
                        className={`segment-btn ${activeTab === 'time' ? 'active' : ''}`}
                        onClick={() => setActiveTab('time')}
                    >
                        <Clock size={16} />
                        {t('payroll.timeTracking')}
                    </button>
                    {userRole !== 'manager' && (
                        <button
                            className={`segment-btn ${activeTab === 'salary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('salary')}
                        >
                            <Calculator size={16} />
                            {t('payroll.salaryCalc')}
                        </button>
                    )}
                    <button
                        className={`segment-btn ${activeTab === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <Users size={16} />
                        {t('payroll.employees')}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'time' && <TimeTrackingTab employees={employees} timeLogs={timeLogs} addTimeLog={addTimeLog} t={t} />}
                    {activeTab === 'salary' && <SalaryTab employees={employees} timeLogs={timeLogs} t={t} />}
                    {activeTab === 'employees' && <EmployeesTab employees={employees} addEmployee={addEmployee} updateEmployee={updateEmployee} deleteEmployee={deleteEmployee} t={t} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const TimeTrackingTab = ({ employees, timeLogs, addTimeLog, t }) => {
    const { userRole } = useAuth();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleTimeChange = async (employeeId, day, value) => {
        const numValue = value; // assuming 'value' is already parsed/clean
        const existingLog = timeLogs.find(log => log.employeeId === employeeId && log.month === selectedMonth);

        let newDailyHours = {};
        if (existingLog && existingLog.dailyHours) {
            newDailyHours = { ...existingLog.dailyHours };
        }

        if (newDailyHours[day] === numValue) return;

        newDailyHours[day] = numValue;

        if (existingLog) {
            try {
                await updateDoc(doc(db, 'timeLogs', existingLog.id), {
                    dailyHours: newDailyHours
                });
            } catch (e) {
                console.error("Error updating time log", e);
            }
        } else {
            try {
                await addDoc(collection(db, 'timeLogs'), {
                    employeeId,
                    month: selectedMonth,
                    dailyHours: newDailyHours
                });
            } catch (e) {
                console.error("Error creating time log", e);
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('payroll.timeTracking')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Отчитане на работни часове по дни.</p>
                </div>
                <div>
                    <input
                        type="month"
                        className="modern-calendar"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto', paddingBottom: '1rem', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-md)' }}>
                <table className="table payroll-grid time-tracking-table" style={{ whiteSpace: 'nowrap', minWidth: 'max-content', margin: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--panel-bg)', minWidth: '150px' }}>ИМЕНАТА</th>
                            <th style={{ position: 'sticky', left: '150px', zIndex: 10, background: 'var(--panel-bg)', minWidth: '80px', borderRight: '2px solid var(--panel-border)' }}>ЗАПЛАТА</th>
                            {daysArray.map(day => (
                                <th key={day} style={{ textAlign: 'center', width: '35px', padding: '0.5rem 0.25rem' }}>{day}</th>
                            ))}
                            <th style={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid var(--panel-border)' }}>ОБЩО</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, index) => {
                            const currentLog = timeLogs.find(l => l.employeeId === emp.id && l.month === selectedMonth) || {};
                            const dailyHours = currentLog.dailyHours || {};
                            const totalHours = Object.values(dailyHours).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

                            const bgVar = index % 2 === 0 ? 'var(--panel-bg)' : 'var(--bg-darker)';

                            return (
                                <tr key={emp.id} style={{ background: bgVar }}>
                                    <td style={{ position: 'sticky', left: 0, zIndex: 5, background: bgVar }}><strong>{emp.name}</strong></td>
                                    <td style={{ position: 'sticky', left: '150px', zIndex: 5, background: bgVar, borderRight: '2px solid var(--panel-border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {userRole === 'admin' ? (emp.hourlyRate ? `${emp.hourlyRate.toFixed(2)} /ч` : '-') : '***'}
                                    </td>
                                    {daysArray.map(day => {
                                        const val = dailyHours[day] || '';
                                        return (
                                            <td key={day} style={{ padding: 0, borderRight: '1px solid var(--panel-border)' }}>
                                                <input
                                                    type="text"
                                                    disabled={userRole === 'viewer'}
                                                    style={{
                                                        width: '40px',
                                                        height: '100%',
                                                        padding: '0.5rem 0',
                                                        textAlign: 'center',
                                                        border: 'none',
                                                        outline: 'none',
                                                        background: 'transparent',
                                                        color: val ? 'var(--text-primary)' : 'var(--text-muted)'
                                                    }}
                                                    defaultValue={val === 0 ? '' : val}
                                                    onBlur={(e) => {
                                                        const typedValue = e.target.value.trim();
                                                        let cleanVal = val;
                                                        if (typedValue === '') cleanVal = 0;
                                                        else {
                                                            const parsed = parseFloat(typedValue.replace(',', '.'));
                                                            if (!isNaN(parsed)) cleanVal = parsed;
                                                        }

                                                        if (cleanVal !== val && (cleanVal !== 0 || val !== '')) {
                                                            handleTimeChange(emp.id, day, cleanVal);
                                                        }
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                        )
                                    })}
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid var(--panel-border)', background: bgVar, color: 'var(--primary-color)' }}>
                                        {totalHours > 0 ? totalHours : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={daysInMonth + 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Няма създадени служители.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <p style={{ color: 'var(--success-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Измененията се запазват автоматично</p>
            </div>
        </div>
    );
};

const SalaryTab = ({ employees, timeLogs, t }) => {
    const { userRole } = useAuth();
    const { addTransaction, updateTransaction, deleteTransaction, transactions, updateEmployee } = useContext(FinanceContext);
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [processingId, setProcessingId] = useState(null);
    const [advanceModeId, setAdvanceModeId] = useState(null);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [editAdvanceModeId, setEditAdvanceModeId] = useState(null);
    const [editAdvanceAmount, setEditAdvanceAmount] = useState('');
    const [travelExpenseModeId, setTravelExpenseModeId] = useState(null);
    const [travelExpenseAmount, setTravelExpenseAmount] = useState('');

    let grandTotal = 0;

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('payroll.salaryCalc')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Финален екран за възнаграждения (Ведомост).</p>
                </div>
                <div>
                    <input
                        type="month"
                        className="modern-calendar"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="table payroll-grid salary-table">
                    <thead>
                        <tr>
                            <th>Служител</th>
                            <th>Начин</th>
                            <th>Отработени Дни/Часове</th>
                            <th style={{ textAlign: 'center' }}>Ставка</th>
                            <th style={{ textAlign: 'right' }}>Пътни</th>
                            <th style={{ textAlign: 'right' }}>Аванси</th>
                            {userRole === 'admin' && <th style={{ textAlign: 'right' }}>Остатък за Плащане</th>}
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            const currentLog = timeLogs.find(l => l.employeeId === emp.id && l.month === selectedMonth) || {};
                            const dailyHours = currentLog.dailyHours || {};
                            const advances = currentLog.advances || [];
                            const isPaid = currentLog.isPaid === true;

                            const totalAdvances = advances.reduce((sum, advance) => sum + (parseFloat(advance.amount) || 0), 0);

                            const travels = currentLog.travelExpenses || [];
                            const totalTravels = travels.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

                            const totalHours = Object.values(dailyHours).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                            const totalDays = Object.values(dailyHours).filter(val => (parseFloat(val) || 0) > 0).length;

                            let baseSalary = 0;

                            if (emp.hourlyRate) {
                                baseSalary = totalHours * emp.hourlyRate;
                            } else if (emp.dailyRate) {
                                baseSalary = totalDays * emp.dailyRate;
                            }

                            const finalSalary = baseSalary + totalTravels;
                            const remainingSalary = finalSalary > 0 ? Math.max(0, finalSalary - totalAdvances) : 0;

                            grandTotal += remainingSalary;

                            return (
                                <tr key={emp.id}>
                                    <td data-label="Служител">
                                        <strong>{emp.name}</strong><br />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.role}</span>
                                    </td>
                                    <td style={{ padding: '0.25rem' }} data-label="Начин">
                                        <select
                                            value={emp.paymentMethod || 'cash'}
                                            onChange={(e) => updateEmployee(emp.id, { paymentMethod: e.target.value })}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid var(--panel-border)',
                                                color: 'var(--text-primary)',
                                                padding: '0.25rem',
                                                borderRadius: 'var(--radius-sm)',
                                                width: '100%',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="cash" style={{ background: 'var(--bg-dark)' }}>В брой</option>
                                            <option value="bank" style={{ background: 'var(--bg-dark)' }}>По банка</option>
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'center' }} data-label="Дни/Часове">{`${totalHours} ч.`}</td>
                                    <td style={{ textAlign: 'center' }} data-label="Ставка">
                                        {userRole === 'admin' ? (emp.hourlyRate ? `${emp.hourlyRate.toFixed(2)} €/ч` : (emp.dailyRate ? `${emp.dailyRate.toFixed(2)} €/ден` : '-')) : '***'}
                                    </td>
                                    <td style={{ textAlign: 'right' }} data-label="Пътни">
                                        {travelExpenseModeId === emp.id ? (
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={travelExpenseAmount}
                                                    onChange={(e) => setTravelExpenseAmount(e.target.value)}
                                                    placeholder="Сума €"
                                                    style={{ width: '70px', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-dark)', color: 'white', fontSize: '0.8rem' }}
                                                    autoFocus
                                                />
                                                <button className="btn btn-primary" style={{ padding: '0.35rem' }} onClick={async () => {
                                                    const amt = parseFloat(travelExpenseAmount.replace(',', '.'));
                                                    if (isNaN(amt) || amt < 0) return alert('Невалидна сума.');
                                                    try {
                                                        let newTravels = [{ amount: amt, date: new Date().toISOString() }];
                                                        if (currentLog.id) {
                                                            await updateDoc(doc(db, 'timeLogs', currentLog.id), { travelExpenses: newTravels });
                                                        } else {
                                                            await addDoc(collection(db, 'timeLogs'), { employeeId: emp.id, month: selectedMonth, dailyHours: {}, travelExpenses: newTravels });
                                                        }
                                                        setTravelExpenseModeId(null);
                                                    } catch (err) { alert(err.message); }
                                                }}><Check size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '0.35rem' }} onClick={() => setTravelExpenseModeId(null)}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {totalTravels > 0 ? (
                                                    <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>+ {totalTravels.toFixed(2)} €</span>
                                                ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                                                {userRole !== 'viewer' && !isPaid && (
                                                    <button className="icon-btn" onClick={() => { setTravelExpenseModeId(emp.id); setTravelExpenseAmount(totalTravels > 0 ? totalTravels.toString() : ''); }} title="Добави Пътни" style={{ padding: '0.25rem', color: 'var(--primary-color)' }}>
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }} data-label="Аванси">
                                        {editAdvanceModeId === emp.id ? (
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={editAdvanceAmount}
                                                    onChange={(e) => setEditAdvanceAmount(e.target.value)}
                                                    style={{ width: '80px', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-dark)', color: 'white', fontSize: '0.8rem' }}
                                                    autoFocus
                                                />
                                                <button className="btn btn-primary" style={{ padding: '0.35rem' }} onClick={async () => {
                                                    const amt = parseFloat(editAdvanceAmount.replace(',', '.'));
                                                    if (isNaN(amt) || amt < 0) return alert('Невалидна сума.');

                                                    try {
                                                        const diff = parseFloat((amt - totalAdvances).toFixed(2));
                                                        if (diff !== 0) {
                                                            const relatedTxns = transactions.filter(t => t.type === 'expense' && (t.description || '').toLowerCase().includes(emp.name.toLowerCase()) && (t.description || '').toLowerCase().includes('аванс') && (t.description || '').toLowerCase().includes(selectedMonth.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));
                                                            if (diff < 0) {
                                                                let toRemove = Math.abs(diff);
                                                                for (let txn of relatedTxns) {
                                                                    if (toRemove <= 0) break;
                                                                    const txnAmt = parseFloat(txn.amount) || 0;
                                                                    if (txnAmt <= toRemove) {
                                                                        deleteTransaction(txn.id);
                                                                        toRemove = parseFloat((toRemove - txnAmt).toFixed(2));
                                                                    } else {
                                                                        updateTransaction(txn.id, { amount: (txnAmt - toRemove).toFixed(2) });
                                                                        toRemove = 0;
                                                                    }
                                                                }
                                                                if (toRemove > 0) {
                                                                    const transactionDate = new Date().toISOString().startsWith(selectedMonth)
                                                                        ? new Date().toISOString().split('T')[0]
                                                                        : `${selectedMonth}-01`;
                                                                    addTransaction({
                                                                        date: transactionDate,
                                                                        type: 'income',
                                                                        category: 'Корекция',
                                                                        amount: toRemove.toFixed(2),
                                                                        description: `Възстановен аванс: ${emp.name}`,
                                                                        paymentMethod: 'cash'
                                                                    });
                                                                }
                                                            } else {
                                                                const method = emp.paymentMethod || 'cash';
                                                                const methodText = method === 'bank' ? 'по банка' : 'в брой';

                                                                if (relatedTxns.length > 0) {
                                                                    const mostRecentTxn = relatedTxns[0];
                                                                    const currentAmt = parseFloat(mostRecentTxn.amount) || 0;
                                                                    updateTransaction(mostRecentTxn.id, { amount: (currentAmt + diff).toFixed(2) });
                                                                } else {
                                                                    const transactionDate = new Date().toISOString().startsWith(selectedMonth)
                                                                        ? new Date().toISOString().split('T')[0]
                                                                        : `${selectedMonth}-01`;

                                                                    addTransaction({
                                                                        date: transactionDate,
                                                                        type: 'expense',
                                                                        category: emp.role || 'ДРУГИ РАСХОДИ',
                                                                        amount: diff.toFixed(2),
                                                                        description: `Аванс: ${emp.name} за ${selectedMonth} (${methodText})`,
                                                                        paymentMethod: method
                                                                    });
                                                                }
                                                            }
                                                        }

                                                        let newAdvances = amt > 0 ? [{ amount: amt, date: new Date().toISOString() }] : [];
                                                        if (currentLog.id) {
                                                            await updateDoc(doc(db, 'timeLogs', currentLog.id), { advances: newAdvances });
                                                        } else if (amt > 0) {
                                                            await addDoc(collection(db, 'timeLogs'), { employeeId: emp.id, month: selectedMonth, dailyHours: {}, advances: newAdvances });
                                                        }
                                                        setEditAdvanceModeId(null);
                                                    } catch (err) { alert(err.message); }
                                                }}><Check size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '0.35rem' }} onClick={() => setEditAdvanceModeId(null)}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            totalAdvances > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <span style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: 'var(--warning-color)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '999px',
                                                        fontWeight: 'bold',
                                                        display: 'inline-block'
                                                    }}>
                                                        - {totalAdvances.toFixed(2)} €
                                                    </span>
                                                    {userRole !== 'viewer' && (
                                                        <button className="btn-icon" onClick={() => { setEditAdvanceModeId(emp.id); setEditAdvanceAmount(totalAdvances.toString()); }} title="Редактиране" style={{ padding: '0.25rem' }}>
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                            )
                                        )}
                                    </td>
                                    {userRole === 'admin' && (
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: isPaid ? 'var(--text-muted)' : 'var(--primary-color)' }} data-label="Остатък">
                                            {isPaid ? <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>Изплатено</span> : `${remainingSalary.toFixed(2)} €`}
                                        </td>
                                    )}
                                    <td style={{ textAlign: 'right' }} data-label="Действия">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', opacity: processingId === emp.id ? 0.5 : 1, pointerEvents: processingId === emp.id ? 'none' : 'auto' }}>
                                            {advanceModeId === emp.id ? (
                                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={advanceAmount}
                                                        onChange={(e) => setAdvanceAmount(e.target.value)}
                                                        placeholder="Сума €"
                                                        style={{ width: '80px', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-dark)', color: 'white', fontSize: '0.8rem' }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.35rem' }}
                                                        onClick={async () => {
                                                            const amt = parseFloat(advanceAmount.replace(',', '.'));
                                                            if (isNaN(amt) || amt <= 0) return alert('Невалидна сума.');
                                                            if (amt > remainingSalary && remainingSalary > 0) return alert(`Сумата надвишава остатъка от ${remainingSalary.toFixed(2)} €`);

                                                            setProcessingId(emp.id);
                                                            try {
                                                                const method = emp.paymentMethod || 'cash';
                                                                const methodText = method === 'bank' ? 'по банка' : 'в брой';
                                                                const desc = `Аванс: ${emp.name} за ${selectedMonth} (${methodText})`;

                                                                // Use the currently selected month and a valid day (01) instead of today's exact date so that the transaction appears correctly in the selected month's ledger.
                                                                const transactionDate = new Date().toISOString().startsWith(selectedMonth)
                                                                    ? new Date().toISOString().split('T')[0]
                                                                    : `${selectedMonth}-01`;

                                                                await addTransaction({
                                                                    date: transactionDate,
                                                                    type: 'expense',
                                                                    category: emp.role || 'ДРУГИ РАСХОДИ',
                                                                    amount: amt.toFixed(2),
                                                                    description: desc,
                                                                    paymentMethod: method
                                                                });

                                                                let newAdvances = [...advances];
                                                                newAdvances.push({ amount: amt, date: new Date().toISOString() });

                                                                if (currentLog.id) {
                                                                    await updateDoc(doc(db, 'timeLogs', currentLog.id), { advances: newAdvances });
                                                                } else {
                                                                    await addDoc(collection(db, 'timeLogs'), { employeeId: emp.id, month: selectedMonth, dailyHours: {}, advances: newAdvances });
                                                                }
                                                                setAdvanceModeId(null);
                                                                setAdvanceAmount('');
                                                            } catch (err) {
                                                                alert("Грешка при запазване: " + err.message);
                                                            }
                                                            setProcessingId(null);
                                                        }}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.35rem' }}
                                                        onClick={() => { setAdvanceModeId(null); setAdvanceAmount(''); }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                        disabled={isPaid}
                                                        onClick={() => { setAdvanceModeId(emp.id); setAdvanceAmount(''); }}
                                                    >
                                                        Аванс
                                                    </button>
                                                    {isPaid ? (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderColor: 'orange', color: 'orange' }}
                                                            onClick={async () => {
                                                                if (!window.confirm(`Отмени плащането за ${emp.name} за ${selectedMonth}? Това също ще изтрие транзакцията за заплата.`)) return;
                                                                setProcessingId(emp.id);
                                                                try {
                                                                    const relatedTxns = transactions.filter(t =>
                                                                        t.type === 'expense' &&
                                                                        (t.description || '').toLowerCase().includes(emp.name.toLowerCase()) &&
                                                                        (t.description || '').toLowerCase().includes(selectedMonth.toLowerCase()) &&
                                                                        (t.description || '').toLowerCase().includes('заплата')
                                                                    );
                                                                    for (let txn of relatedTxns) {
                                                                        deleteTransaction(txn.id);
                                                                    }

                                                                    if (currentLog.id) {
                                                                        await updateDoc(doc(db, 'timeLogs', currentLog.id), { isPaid: false });
                                                                    }
                                                                } catch (err) {
                                                                    alert("Грешка при запазване: " + err.message);
                                                                }
                                                                setProcessingId(null);
                                                            }}
                                                        >
                                                            Отмени
                                                        </button>
                                                    ) : (
                                                        userRole === 'admin' && (
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                disabled={remainingSalary <= 0 && totalTravels === 0}
                                                                onClick={async () => {
                                                                    const method = emp.paymentMethod || 'cash';
                                                                    const methodText = method === 'bank' ? 'по банка' : 'в брой';
                                                                    const confirmMsg = `Изплащане: ${emp.name} за ${selectedMonth}\nОстатък Заплата: ${(remainingSalary - totalTravels).toFixed(2)} €\nПътни: ${totalTravels.toFixed(2)} €\nОБЩО: ${remainingSalary.toFixed(2)} €`;
                                                                    if (!window.confirm(confirmMsg)) return;
                                                                    setProcessingId(emp.id);
                                                                    try {
                                                                        const transactionDate = new Date().toISOString().startsWith(selectedMonth)
                                                                            ? new Date().toISOString().split('T')[0]
                                                                            : `${selectedMonth}-01`;

                                                                        const pureSalary = remainingSalary - totalTravels;

                                                                        // Transaction 1: Pure Salary Remaining
                                                                        if (pureSalary > 0) {
                                                                            await addTransaction({
                                                                                date: transactionDate,
                                                                                type: 'expense',
                                                                                category: emp.role || 'ДРУГИ РАСХОДИ',
                                                                                amount: pureSalary.toFixed(2),
                                                                                description: `Изплатен остатък от заплата: ${emp.name} за ${selectedMonth} (${methodText})`,
                                                                                paymentMethod: method
                                                                            });
                                                                        }

                                                                        // Transaction 2: Travel Expenses
                                                                        if (totalTravels > 0) {
                                                                            await addTransaction({
                                                                                date: transactionDate,
                                                                                type: 'expense',
                                                                                category: 'ПЪТНИ РАЗХОДИ',
                                                                                amount: totalTravels.toFixed(2),
                                                                                description: `Изплатени пътни разходи: ${emp.name} за ${selectedMonth} (${methodText})`,
                                                                                paymentMethod: method
                                                                            });
                                                                        }

                                                                        if (currentLog.id) {
                                                                            await updateDoc(doc(db, 'timeLogs', currentLog.id), { isPaid: true });
                                                                        } else {
                                                                            await addDoc(collection(db, 'timeLogs'), { employeeId: emp.id, month: selectedMonth, dailyHours: {}, isPaid: true });
                                                                        }
                                                                    } catch (err) {
                                                                        alert("Грешка при запазване: " + err.message);
                                                                    }
                                                                    setProcessingId(null);
                                                                }}
                                                            >
                                                                Изплати
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Няма данни.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {employees.length > 0 && userRole === 'admin' && (
                        <tfoot>
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Общо остатъчни задължения (месец):</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success-color)' }}>
                                    {grandTotal.toFixed(2)} €
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

const EmployeesTab = ({ employees, addEmployee, updateEmployee, deleteEmployee, t }) => {
    const { userRole } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', role: '', hourlyRate: '', dailyRate: '' });

    const roleOptions = [
        "ЗАПЛАТА УПРАВИТЕЛИИ, ОФИС И ВОДИТЕЛЬ",
        "ЗАПЛАТИ РЕЦЕПЦИЯ",
        "ЗАПЛАТИ КАМЕРИЕРКИ",
        "ЗАПЛАТИ КУХНЯ",
        "ЗАПЛАТИ СЕРВИТЬОРИ,ЧЕКЪРИ,БАРМЕН",
        "ЗАПЛАТА СПАСИТЕЛИ",
        "ЗАПЛАТА АНИМАТОРИ"
    ];

    const handleSave = () => {
        if (!formData.name.trim()) return;

        const payload = {
            name: formData.name,
            role: formData.role,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            dailyRate: parseFloat(formData.dailyRate) || 0
        };

        if (editingId) {
            updateEmployee(editingId, payload);
            setEditingId(null);
        } else {
            addEmployee(payload);
            setIsAdding(false);
        }
        setFormData({ name: '', role: '', hourlyRate: '', dailyRate: '' });
    };

    const handleEdit = (emp) => {
        setFormData({
            name: emp.name,
            role: emp.role || '',
            hourlyRate: emp.hourlyRate || '',
            dailyRate: emp.dailyRate || ''
        });
        setEditingId(emp.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', role: '', hourlyRate: '', dailyRate: '' });
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Служители</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Управление на персонал и базови ставки.</p>
                </div>
                {!isAdding && userRole !== 'viewer' && (
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={18} />
                        Добави служител
                    </button>
                )}
            </div>

            {isAdding && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ background: 'var(--bg-lighter)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--panel-border)' }}
                >
                    <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Редактиране' : 'Нов служител'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label>Име на служител</label>
                            <input type="text" className="filter-input" placeholder="Напр. Иван Иванов" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '0.6rem 1rem' }} />
                        </div>
                        <div className="input-group">
                            <label>Категория Заплата</label>
                            <select
                                className="filter-input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem 1rem' }}
                            >
                                <option value="">Изберете категория...</option>
                                {roleOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {userRole === 'admin' && (
                            <>
                                <div className="input-group">
                                    <label>Ставка на Час (€)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>€</span>
                                        <input type="number" step="0.01" className="filter-input" placeholder="0.00" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} style={{ paddingLeft: '2rem' }} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Ставка за Ден (€)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>€</span>
                                        <input type="number" step="0.01" className="filter-input" placeholder="0.00" value={formData.dailyRate} onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })} style={{ paddingLeft: '2rem' }} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={handleCancel}>Отказ</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim()}>Запази</button>
                    </div>
                </motion.div>
            )}

            <div className="table-container">
                <table className="table payroll-grid employees-table">
                    <thead>
                        <tr>
                            <th style={{ padding: '0.5rem' }}>Име</th>
                            <th style={{ padding: '0.5rem' }}>Длъжност</th>
                            {userRole === 'admin' && <th style={{ padding: '0.5rem' }}>Ставка / Час</th>}
                            {userRole === 'admin' && <th style={{ padding: '0.5rem' }}>Ставка / Ден</th>}
                            {userRole !== 'viewer' && <th style={{ textAlign: 'right', padding: '0.5rem' }}>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id}>
                                <td style={{ padding: '0.5rem' }} data-label="Име"><strong>{emp.name}</strong></td>
                                <td style={{ padding: '0.5rem' }} data-label="Длъжност">{emp.role || '-'}</td>
                                {userRole === 'admin' && <td style={{ padding: '0.5rem' }} data-label="Ставка / Час">{emp.hourlyRate ? `${emp.hourlyRate.toFixed(2)} €` : '-'}</td>}
                                {userRole === 'admin' && <td style={{ padding: '0.5rem' }} data-label="Ставка / Ден">{emp.dailyRate ? `${emp.dailyRate.toFixed(2)} €` : '-'}</td>}
                                {userRole !== 'viewer' && (
                                    <td style={{ padding: '0.5rem' }} data-label="Действия">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <button className="icon-btn" onClick={() => handleEdit(emp)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn" onClick={() => { if (window.confirm('Сигурни ли сте?')) deleteEmployee(emp.id); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={userRole === 'admin' ? 4 : (userRole === 'viewer' ? 2 : 3)} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Няма въведени служители.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
