import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Trash2, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const Transactions = () => {
    const { transactions, deleteTransaction, addTransaction, updateTransaction, categories } = useFinance();
    const { userRole } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'month', 'year'
    const [dateFilterValue, setDateFilterValue] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const translateCategory = (cat) => t('categoryNames', { returnObjects: true })[cat] || cat;

    // New/Edit Transaction Form State
    const [editingId, setEditingId] = useState(null);
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories.expense[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const filteredTransactions = transactions.filter(txn => {
        if (filterType !== 'all' && txn.type !== filterType) {
            return false;
        }

        if (dateFilterType !== 'all' && dateFilterValue) {
            if (dateFilterType === 'month' && !txn.date.startsWith(dateFilterValue)) return false;
            if (dateFilterType === 'year' && !txn.date.startsWith(dateFilterValue)) return false;
        }

        const categoryMatchString = translateCategory(txn.category);

        return txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            categoryMatchString.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleAddTransaction = (e) => {
        e.preventDefault();
        if (!amount) return;

        const payload = {
            type,
            amount: parseFloat(amount),
            category,
            date,
            description,
            paymentMethod
        };

        if (editingId) {
            updateTransaction(editingId, payload);
        } else {
            addTransaction(payload);
        }

        setIsModalOpen(false);
        // Reset form
        setEditingId(null);
        setAmount('');
        setDescription('');
        setPaymentMethod('cash');
    };

    const openEditModal = (txn) => {
        setEditingId(txn.id);
        setType(txn.type);
        setAmount(txn.amount);
        setCategory(txn.category);
        setDate(txn.date);
        setDescription(txn.description);
        setPaymentMethod(txn.paymentMethod || 'cash');
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setType('expense');
        setAmount('');
        setCategory(categories.expense[0] || '');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setPaymentMethod('cash');
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('transactions.title')}</h1>
                    <p className="page-subtitle">{t('transactions.subtitle')}</p>
                </div>
                {userRole !== 'viewer' && (
                    <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                        <Plus size={18} />
                        {t('transactions.addTransaction')}
                    </button>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('transactions.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid var(--panel-border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">{t('transactions.allTypes')}</option>
                        <option value="income">{t('transactions.income')}</option>
                        <option value="expense">{t('transactions.expense')}</option>
                    </select>

                    <select
                        value={dateFilterType}
                        onChange={(e) => {
                            setDateFilterType(e.target.value);
                            setDateFilterValue('');
                        }}
                        className="filter-select"
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">{t('dashboard.filterAll')}</option>
                        <option value="month">{t('dashboard.filterMonth')}</option>
                        <option value="year">{t('dashboard.filterYear')}</option>
                    </select>

                    {dateFilterType === 'month' && (
                        <input
                            type="month"
                            className="filter-input"
                            value={dateFilterValue}
                            onChange={(e) => setDateFilterValue(e.target.value)}
                        />
                    )}
                    {dateFilterType === 'year' && (
                        <input
                            type="number"
                            className="filter-input"
                            placeholder="YYYY"
                            min="2000"
                            max="2100"
                            value={dateFilterValue}
                            onChange={(e) => setDateFilterValue(e.target.value)}
                            style={{ width: '120px' }}
                        />
                    )}
                </div>


                {/* Transactions Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>{t('transactions.colTransaction')}</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>{t('transactions.colCategory')}</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>{t('transactions.paymentMethod')}</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>{t('transactions.colDate')}</th>
                                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>{t('transactions.colAmount')}</th>
                                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>{t('transactions.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        {t('transactions.noTransactions')}
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((txn) => (
                                    <tr key={txn.id} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%', display: 'grid', placeItems: 'center',
                                                    background: txn.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                    color: txn.type === 'income' ? 'var(--success)' : 'var(--danger)'
                                                }}>
                                                    {txn.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {txn.description.startsWith('Payment for Invoice:')
                                                            ? txn.description.replace('Payment for Invoice:', t('invoices.paymentFor'))
                                                            : txn.description}
                                                    </p>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{txn.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${txn.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                                {translateCategory(txn.category)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                                {txn.paymentMethod === 'bank' ? t('transactions.bank') : t('transactions.cash')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: txn.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                        {userRole !== 'viewer' && (
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn-icon" onClick={() => openEditModal(txn)} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn-icon" onClick={() => deleteTransaction(txn.id)} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}
                        >
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                                {editingId ? 'Редактиране' : t('transactions.addNewTitle')}
                            </h2>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <button
                                    type="button"
                                    className={`btn ${type === 'expense' ? 'btn-primary' : ''}`}
                                    style={{ flex: 1, background: type === 'expense' ? 'var(--danger)' : 'transparent', border: type !== 'expense' ? '1px solid var(--panel-border)' : 'none' }}
                                    onClick={() => { setType('expense'); setCategory(categories.expense[0]); }}
                                >
                                    {t('transactions.expense')}
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${type === 'income' ? 'btn-primary' : ''}`}
                                    style={{ flex: 1, background: type === 'income' ? 'var(--success)' : 'transparent', border: type !== 'income' ? '1px solid var(--panel-border)' : 'none' }}
                                    onClick={() => { setType('income'); setCategory(categories.income[0]); }}
                                >
                                    {t('transactions.income')}
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction}>
                                <div className="input-group">
                                    <label>{t('transactions.colAmount')} (€)</label>
                                    <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                                </div>

                                <div className="input-group">
                                    <label>{t('transactions.description')}</label>
                                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('transactions.whatFor')} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>{t('transactions.colCategory')}</label>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                            {categories[type].map(cat => (
                                                <option key={cat} value={cat}>
                                                    {translateCategory(cat)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>{t('transactions.colDate')}</label>
                                        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginTop: '0.5rem' }}>
                                    <label>{t('transactions.paymentMethod')}</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid', borderRadius: 'var(--radius-sm)', flex: 1, background: paymentMethod === 'cash' ? 'var(--primary-glow)' : 'transparent', borderColor: paymentMethod === 'cash' ? 'var(--primary)' : 'var(--panel-border)', transition: 'var(--transition)' }}>
                                            <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ display: 'none' }} />
                                            <span style={{ color: paymentMethod === 'cash' ? 'var(--primary)' : 'var(--text-primary)', transition: 'var(--transition)' }}>{t('transactions.cash')}</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid', borderRadius: 'var(--radius-sm)', flex: 1, background: paymentMethod === 'bank' ? 'var(--primary-glow)' : 'transparent', borderColor: paymentMethod === 'bank' ? 'var(--primary)' : 'var(--panel-border)', transition: 'var(--transition)' }}>
                                            <input type="radio" name="paymentMethod" value="bank" checked={paymentMethod === 'bank'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ display: 'none' }} />
                                            <span style={{ color: paymentMethod === 'bank' ? 'var(--primary)' : 'var(--text-primary)', transition: 'var(--transition)' }}>{t('transactions.bank')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>{t('transactions.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('transactions.save')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
