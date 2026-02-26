import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Trash2, DollarSign, Camera, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const Invoices = () => {
    const { invoices, addInvoice, updateInvoice, deleteInvoice, addTransaction, transactions, updateTransaction, deleteTransaction } = useFinance();
    const { userRole } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState('');

    // Create/Edit Invoice State
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
    const [clientName, setClientName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    // Payment State
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank'); // Default to bank for invoices

    const filteredInvoices = invoices.filter(inv => {
        return inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.description && inv.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const handleScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        setScanProgress(t('invoices.scanProgress'));

        let worker = null;
        try {
            worker = await Tesseract.createWorker('bul+eng');
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
            });

            const result = await worker.recognize(file);
            const text = result.data.text;
            console.log("OCR Result Text:\n", text);

            // Basic parsing logic
            // 1. Total Amount: Try strict match, then fallback to finding the highest reasonable currency number
            let extractedAmount = null;
            const amountStrMatch = text.match(/(?:обща сума|сума за плащане|сума|total|плащане|стойност|всичко|ддс|основа)[\s:A-Za-zА-Яа-я]*([\d\s]+[.,]\d{2})/i);
            if (amountStrMatch && amountStrMatch[1]) {
                extractedAmount = parseFloat(amountStrMatch[1].replace(/\s/g, '').replace(',', '.'));
            } else {
                // Fallback: Find all 0.00 or 0,00 formatted numbers in the text and get the maximum
                const allNumbers = [...text.matchAll(/\b(\d{1,6}[.,]\d{2})\b/g)];
                if (allNumbers.length > 0) {
                    const parsedNums = allNumbers.map(m => parseFloat(m[1].replace(',', '.'))).filter(n => !isNaN(n));
                    if (parsedNums.length > 0) extractedAmount = Math.max(...parsedNums);
                }
            }
            if (extractedAmount && !isNaN(extractedAmount)) {
                setTotalAmount(extractedAmount.toFixed(2));
            }

            // 2. Client Name: Look for common buyer/receiver prefixes
            const clientMatch = text.match(/(?:получател|клиент|получател:|клиент:|купувач)\s+([A-Za-zА-Яа-я0-9\s.,\-"']+)/i) || text.match(/([А-Я][А-Яа-я]+(?:\s[А-Яа-я]+)?\s+(?:ООД|ЕООД|АД|ЕАД|ЕТ))/i);
            if (clientMatch && clientMatch[1]) {
                const cleanedClient = clientMatch[1].replace(/(?:ЕИК|ДДС|BG\d+|гр\.|ул\.).*/i, '').trim();
                setClientName(cleanedClient.substring(0, 50));
            }

            // 3. Date (DD-MM-YYYY or DD.MM.YYYY even if missing dots)
            const dateMatch = text.match(/(?:дата|date)[\s:.]*(\d{2})[/\-.]?(\d{2})[/\-.]?(\d{4})/i) || text.match(/(\d{2})[/\-.](\d{2})[/\-.](\d{2,4})/);
            if (dateMatch) {
                const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
                setDueDate(`${year}-${dateMatch[2]}-${dateMatch[1]}`);
            }

            // Open Modal with prefilled values
            setIsCreateModalOpen(true);
        } catch (error) {
            console.error("OCR Error:", error);
            const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            alert(t('invoices.scanError') + " " + errMsg);
        } finally {
            if (worker) {
                await worker.terminate().catch(console.error);
            }
            setIsScanning(false);
            setScanProgress('');
            e.target.value = null;
        }
    };

    const handleAddInvoice = (e) => {
        e.preventDefault();
        if (!clientName || !totalAmount) return;

        const payload = {
            clientName,
            totalAmount: parseFloat(totalAmount),
            dueDate,
            description
        };

        if (editingInvoiceId) {
            const oldPaid = invoices.find(i => i.id === editingInvoiceId)?.paidAmount || 0;
            payload.paidAmount = paidAmount !== '' ? parseFloat(paidAmount) : 0;
            const diff = parseFloat((payload.paidAmount - oldPaid).toFixed(2));

            if (diff !== 0) {
                const relatedTxns = transactions.filter(t => t.type === 'income' && (t.description || '').toLowerCase().includes(clientName.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));
                let remainingDiff = diff;

                if (remainingDiff < 0) {
                    let toRemove = Math.abs(remainingDiff);
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
                        addTransaction({
                            type: 'expense',
                            amount: toRemove.toFixed(2),
                            category: 'Корекция',
                            date: new Date().toISOString().split('T')[0],
                            description: `Корекция (намалено плащане): ${clientName}`,
                            paymentMethod: 'cash'
                        });
                    }
                } else {
                    addTransaction({
                        type: 'income',
                        amount: remainingDiff.toFixed(2),
                        category: 'Плащания',
                        date: new Date().toISOString().split('T')[0],
                        description: `${t('invoices.paymentFor')} ${clientName}`,
                        paymentMethod: 'cash'
                    });
                }
            }

            updateInvoice(editingInvoiceId, payload);
        } else {
            payload.paidAmount = 0;
            payload.createdAt = new Date().toISOString();
            addInvoice(payload);
        }

        setIsCreateModalOpen(false);
        setEditingInvoiceId(null);
        setClientName('');
        setTotalAmount('');
        setPaidAmount('');
        setDescription('');
        setDueDate(new Date().toISOString().split('T')[0]);
    };

    const handleOpenEditModal = (inv) => {
        setEditingInvoiceId(inv.id);
        setClientName(inv.clientName);
        setTotalAmount(inv.totalAmount.toString());
        setPaidAmount((inv.paidAmount || 0).toString());
        setDueDate(inv.dueDate || new Date().toISOString().split('T')[0]);
        setDescription(inv.description || '');
        setIsCreateModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingInvoiceId(null);
        setClientName('');
        setTotalAmount('');
        setPaidAmount('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setIsCreateModalOpen(true);
    };

    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount((invoice.totalAmount - (invoice.paidAmount || 0)).toString());
        setIsPaymentModalOpen(true);
    };

    const handleAddPayment = (e) => {
        e.preventDefault();
        if (!paymentAmount || parseFloat(paymentAmount) <= 0 || !selectedInvoice) return;

        const amountToPay = parseFloat(paymentAmount);

        // 1. Update the Invoice
        const newPaidAmount = (selectedInvoice.paidAmount || 0) + amountToPay;
        updateInvoice(selectedInvoice.id, {
            paidAmount: newPaidAmount
        });

        // 2. Create a corresponding generic Income transaction
        addTransaction({
            type: 'income',
            amount: amountToPay,
            category: 'Other', // Generic category to ensure it's logged
            date: new Date().toISOString().split('T')[0],
            description: `${t('invoices.paymentFor')} ${selectedInvoice.clientName}`,
            paymentMethod: paymentMethod
        });

        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        setPaymentAmount('');
    };

    const getStatusText = (invoice) => {
        const paid = invoice.paidAmount || 0;
        const total = invoice.totalAmount || 0;
        if (paid === 0) return t('invoices.statusUnpaid');
        if (paid >= total) return t('invoices.statusPaid');
        return t('invoices.statusPartial');
    };

    const getStatusColor = (invoice) => {
        const paid = invoice.paidAmount || 0;
        const total = invoice.totalAmount || 0;
        if (paid === 0) return 'var(--danger)';
        if (paid >= total) return 'var(--success)';
        return 'var(--warning)';
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t('invoices.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('invoices.subtitle')}</p>
                </div>
                {userRole !== 'viewer' && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div>
                            <input
                                type="file"
                                accept="image/*, application/pdf"
                                capture="environment"
                                style={{ display: 'none' }}
                                id="scan-invoice-upload"
                                onChange={handleScan}
                                disabled={isScanning}
                            />
                            <label
                                htmlFor="scan-invoice-upload"
                                className="btn"
                                style={{
                                    background: 'var(--bg-lighter)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--panel-border)',
                                    cursor: isScanning ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: 500,
                                    opacity: isScanning ? 0.7 : 1
                                }}
                            >
                                {isScanning ? (
                                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Camera size={20} />
                                )}
                                {isScanning ? scanProgress : t('invoices.scanInvoice')}
                            </label>
                        </div>
                        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                            <Plus size={20} />
                            {t('invoices.addInvoice')}
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('invoices.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                </div>

                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('invoices.colClient')}</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('invoices.colTotal')}</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('invoices.colPaid')}</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('invoices.colDue')}</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('invoices.colStatus')}</th>
                                {userRole !== 'viewer' && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>{t('invoices.colActions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredInvoices.map((inv) => (
                                    <motion.tr
                                        key={inv.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ borderBottom: '1px solid var(--panel-border)' }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inv.clientName}</div>
                                            {inv.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{inv.description}</div>}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                                        <td style={{ padding: '1rem', color: 'var(--success)' }}>{formatCurrency(inv.paidAmount || 0)}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{inv.dueDate}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                background: `${getStatusColor(inv)}20`,
                                                color: getStatusColor(inv)
                                            }}>
                                                {getStatusText(inv)}
                                            </span>
                                        </td>
                                        {userRole !== 'viewer' && (
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {parseFloat(inv.paidAmount || 0) < parseFloat(inv.totalAmount || 0) && (
                                                        <button
                                                            onClick={() => handleOpenPaymentModal(inv)}
                                                            className="btn-icon"
                                                            style={{ color: 'var(--success)' }}
                                                            title={t('invoices.addPayment')}
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenEditModal(inv)}
                                                        className="btn-icon"
                                                        title="Редактиране"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteInvoice(inv.id)}
                                                        className="btn-icon text-danger"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {filteredInvoices.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t('transactions.noTransactions')} {/* Reusing translation for now */}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Invoice Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel"
                            style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                                {editingInvoiceId ? 'Редактиране на Фактура' : t('invoices.addInvoice')}
                            </h2>
                            <form onSubmit={handleAddInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div className="input-group">
                                    <label>{t('invoices.colClient')} *</label>
                                    <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className="filter-input" />
                                </div>

                                <div className="input-group">
                                    <label>{t('invoices.colTotal')} *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>€</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={totalAmount}
                                            onChange={(e) => setTotalAmount(e.target.value)}
                                            style={{ paddingLeft: '2rem' }}
                                            className="filter-input"
                                        />
                                    </div>
                                </div>

                                {editingInvoiceId && (
                                    <div className="input-group">
                                        <label>{t('invoices.colPaid')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>€</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(e.target.value)}
                                                style={{ paddingLeft: '2rem' }}
                                                className="filter-input"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="input-group">
                                    <label>{t('invoices.colDue')}</label>
                                    <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="filter-input" />
                                </div>

                                <div className="input-group">
                                    <label>{t('invoices.description')}</label>
                                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="filter-input" />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsCreateModalOpen(false)}>
                                        {t('transactions.cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingInvoiceId ? 'Запази' : t('invoices.saveInvoice')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && selectedInvoice && (
                    <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel"
                            style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{t('invoices.addPayment')}</h2>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                {t('invoices.colClient')}: <strong style={{ color: 'var(--text-primary)' }}>{selectedInvoice.clientName}</strong>
                            </p>

                            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div className="input-group">
                                    <label>{t('invoices.paymentAmount')} *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>€</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max={selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)} // Can't overpay
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            style={{ paddingLeft: '2rem' }}
                                            className="filter-input"
                                        />
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        Remaining Balance: {formatCurrency(selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0))}
                                    </small>
                                </div>

                                <div className="input-group">
                                    <label>{t('transactions.paymentMethod')}</label>
                                    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cash"
                                                checked={paymentMethod === 'cash'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                            {t('transactions.cash')}
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="bank"
                                                checked={paymentMethod === 'bank'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                            {t('transactions.bank')}
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsPaymentModalOpen(false)}>
                                        {t('transactions.cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {t('invoices.savePayment')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
