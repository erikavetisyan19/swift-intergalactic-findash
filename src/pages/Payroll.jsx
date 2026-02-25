import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, Calculator, Plus, Trash2, Edit2, Save, Send } from 'lucide-react';
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
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
                <button
                    className={`btn ${activeTab === 'time' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('time')}
                    style={{ background: activeTab !== 'time' ? 'transparent' : '', border: activeTab !== 'time' ? '1px solid var(--panel-border)' : '' }}
                >
                    <Clock size={18} />
                    {t('payroll.timeTracking')}
                </button>
                {userRole !== 'manager' && (
                    <button
                        className={`btn ${activeTab === 'salary' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('salary')}
                        style={{ background: activeTab !== 'salary' ? 'transparent' : '', border: activeTab !== 'salary' ? '1px solid var(--panel-border)' : '' }}
                    >
                        <Calculator size={18} />
                        {t('payroll.salaryCalc')}
                    </button>
                )}
                <button
                    className={`btn ${activeTab === 'employees' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('employees')}
                    style={{ background: activeTab !== 'employees' ? 'transparent' : '', border: activeTab !== 'employees' ? '1px solid var(--panel-border)' : '' }}
                >
                    <Users size={18} />
                    {t('payroll.employees')}
                </button>
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
                    {activeTab === 'salary' && userRole !== 'manager' && <SalaryTab employees={employees} timeLogs={timeLogs} t={t} />}
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
                        className="input"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ background: 'var(--bg-lighter)' }}
                    />
                </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto', paddingBottom: '1rem', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-md)' }}>
                <table className="table" style={{ whiteSpace: 'nowrap', minWidth: 'max-content', margin: 0 }}>
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
    const { addTransaction, updateTransaction, transactions } = useContext(FinanceContext);
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [paymentMethod, setPaymentMethod] = useState('по банка');
    const [isGenerating, setIsGenerating] = useState(false);

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
                        className="input"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ background: 'var(--bg-lighter)' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ background: 'var(--bg-lighter)', width: 'auto', padding: '0.5rem 1rem' }}
                >
                    <option value="по банка">По банка</option>
                    <option value="в брой">В брой</option>
                </select>
                <button
                    className="btn btn-primary"
                    onClick={async () => {
                        setIsGenerating(true);
                        try {
                            const expensesByCategory = {};
                            let totalProcessedSalary = 0;
                            employees.forEach(emp => {
                                if (!emp.role) return;

                                const currentLog = timeLogs.find(l => l.employeeId === emp.id && l.month === selectedMonth) || {};
                                const dailyHours = currentLog.dailyHours || {};

                                const totalHours = Object.values(dailyHours).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

                                let salary = 0;
                                if (emp.hourlyRate) salary = totalHours * emp.hourlyRate;

                                if (salary > 0) {
                                    expensesByCategory[emp.role] = (expensesByCategory[emp.role] || 0) + salary;
                                    totalProcessedSalary += salary;
                                }
                            });

                            let totalExpensesCreated = 0;
                            let totalExpensesUpdated = 0;
                            const baseDescription = `Обобщени заплати за ${selectedMonth}`;
                            const descriptionLabel = `${baseDescription} (${paymentMethod})`;

                            for (const [category, amount] of Object.entries(expensesByCategory)) {
                                const existingTx = transactions.find(t => t.type === 'expense' && t.category === category && t.description && t.description.startsWith(baseDescription));

                                if (existingTx) {
                                    await updateTransaction(existingTx.id, {
                                        amount: amount.toFixed(2),
                                        description: descriptionLabel,
                                        paymentMethod: paymentMethod === 'по банка' ? 'bank' : 'cash'
                                    });
                                    totalExpensesUpdated++;
                                } else {
                                    await addTransaction({
                                        date: new Date().toISOString().split('T')[0],
                                        type: 'expense',
                                        category: category,
                                        amount: amount.toFixed(2),
                                        description: descriptionLabel,
                                        paymentMethod: paymentMethod === 'по банка' ? 'bank' : 'cash'
                                    });
                                    totalExpensesCreated++;
                                }
                            }

                            if (totalExpensesCreated > 0 || totalExpensesUpdated > 0) {
                                alert(`Успешно обработени разходи за месец ${selectedMonth} (Нови: ${totalExpensesCreated}, Актуализирани: ${totalExpensesUpdated}, Общо: ${totalProcessedSalary.toFixed(2)} €).`);
                            } else {
                                alert('Внимание: 0 генерирани разходи! Проверете дали в "Отработени Дни/Часове" (Time Tracking) има въведени часове за този месец и дали има зададена "Ставка на Час".');
                            }
                        } catch (error) {
                            console.error("Error generating expenses:", error);
                            alert("Възникна грешка при генерирането на разходи: " + error.message);
                        }
                        setIsGenerating(false);
                    }}
                    disabled={isGenerating || employees.length === 0}
                >
                    <Send size={18} />
                    {isGenerating ? 'Обработка...' : 'Изплати Заплати & Създай Разходи'}
                </button>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Служител</th>
                            <th>Отработени Дни/Часове</th>
                            <th>Ставка</th>
                            <th style={{ textAlign: 'right' }}>Общо за Плащане</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            const currentLog = timeLogs.find(l => l.employeeId === emp.id && l.month === selectedMonth) || {};
                            const dailyHours = currentLog.dailyHours || {};

                            const totalHours = Object.values(dailyHours).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                            const totalDays = Object.values(dailyHours).filter(val => (parseFloat(val) || 0) > 0).length;

                            let finalSalary = 0;
                            let calculationText = '-';

                            if (emp.hourlyRate) {
                                finalSalary = totalHours * emp.hourlyRate;
                                calculationText = `${totalHours} ч. × ${emp.hourlyRate.toFixed(2)} €`;
                            }

                            grandTotal += finalSalary;

                            return (
                                <tr key={emp.id}>
                                    <td>
                                        <strong>{emp.name}</strong><br />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.role}</span>
                                    </td>
                                    <td>{`${totalHours} часове`}</td>
                                    <td>{emp.hourlyRate ? `${emp.hourlyRate.toFixed(2)} €/ч` : '-'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                                        {finalSalary.toFixed(2)} €
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
                    {employees.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Общо задължения за месеца:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success-color)' }}>
                                    {grandTotal.toFixed(2)} €
                                </td>
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
    const [formData, setFormData] = useState({ name: '', role: '', hourlyRate: '' });

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
            hourlyRate: parseFloat(formData.hourlyRate) || 0
        };

        if (editingId) {
            updateEmployee(editingId, payload);
            setEditingId(null);
        } else {
            addEmployee(payload);
            setIsAdding(false);
        }
        setFormData({ name: '', role: '', hourlyRate: '' });
    };

    const handleEdit = (emp) => {
        setFormData({
            name: emp.name,
            role: emp.role || '',
            hourlyRate: emp.hourlyRate || ''
        });
        setEditingId(emp.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', role: '', hourlyRate: '' });
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Име</label>
                            <input type="text" className="input" placeholder="Иван Иванов" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Категория Заплата</label>
                            <select
                                className="input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{ background: 'var(--bg-lighter)', width: '100%' }}
                            >
                                <option value="">Изберете категория...</option>
                                {roleOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        {userRole === 'admin' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ставка на Час (€)</label>
                                <input type="number" step="0.01" className="input" placeholder="0.00" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={handleCancel}>Отказ</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name.trim()}>Запази</button>
                    </div>
                </motion.div>
            )}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ padding: '0.5rem' }}>Име</th>
                            <th style={{ padding: '0.5rem' }}>Длъжност</th>
                            {userRole === 'admin' && <th style={{ padding: '0.5rem' }}>Ставка / Час</th>}
                            {userRole !== 'viewer' && <th style={{ textAlign: 'right', padding: '0.5rem' }}>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id}>
                                <td style={{ padding: '0.5rem' }}><strong>{emp.name}</strong></td>
                                <td style={{ padding: '0.5rem' }}>{emp.role || '-'}</td>
                                {userRole === 'admin' && <td style={{ padding: '0.5rem' }}>{emp.hourlyRate ? `${emp.hourlyRate.toFixed(2)} €` : '-'}</td>}
                                {userRole !== 'viewer' && (
                                    <td style={{ padding: '0.5rem' }}>
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
