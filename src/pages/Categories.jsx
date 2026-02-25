import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Categories = () => {
    const { categories, addCategory, deleteCategory } = useFinance();
    const { userRole } = useAuth();
    const { t } = useTranslation();
    const [newExpenseCat, setNewExpenseCat] = useState('');
    const [newIncomeCat, setNewIncomeCat] = useState('');

    const translateCategory = (cat) => t('categoryNames', { returnObjects: true })[cat] || cat;

    const handleAddCategory = (e, type) => {
        e.preventDefault();
        if (type === 'expense' && newExpenseCat.trim()) {
            addCategory('expense', newExpenseCat.trim());
            setNewExpenseCat('');
        } else if (type === 'income' && newIncomeCat.trim()) {
            addCategory('income', newIncomeCat.trim());
            setNewIncomeCat('');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('categories.title')}</h1>
                    <p className="page-subtitle">{t('categories.subtitle')}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                {/* Income Categories */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>
                            <Tag size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>{t('categories.incomeCategories')}</h2>
                    </div>

                    {userRole !== 'viewer' && (
                        <form onSubmit={(e) => handleAddCategory(e, 'income')} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <input
                                    type="text"
                                    placeholder={t('categories.addIncome')}
                                    value={newIncomeCat}
                                    onChange={(e) => setNewIncomeCat(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', height: 'fit-content' }}>
                                <Plus size={20} />
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <AnimatePresence>
                            {categories.income.map(cat => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key={cat}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--panel-border)'
                                    }}
                                >
                                    <span style={{ fontWeight: 500 }}>
                                        {translateCategory(cat)}
                                    </span>
                                    {userRole !== 'viewer' && (
                                        <button className="btn-icon" onClick={() => deleteCategory('income', cat)} title={`Delete ${cat}`}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Expense Categories */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
                            <Tag size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>{t('categories.expenseCategories')}</h2>
                    </div>

                    {userRole !== 'viewer' && (
                        <form onSubmit={(e) => handleAddCategory(e, 'expense')} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <input
                                    type="text"
                                    placeholder={t('categories.addExpense')}
                                    value={newExpenseCat}
                                    onChange={(e) => setNewExpenseCat(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn" style={{ background: 'var(--danger)', color: 'white', padding: '0.75rem', height: 'fit-content' }}>
                                <Plus size={20} />
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <AnimatePresence>
                            {categories.expense.map(cat => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key={cat}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--panel-border)'
                                    }}
                                >
                                    <span style={{ fontWeight: 500 }}>
                                        {translateCategory(cat)}
                                    </span>
                                    {userRole !== 'viewer' && (
                                        <button className="btn-icon" onClick={() => deleteCategory('expense', cat)} title={`Delete ${cat}`}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};
