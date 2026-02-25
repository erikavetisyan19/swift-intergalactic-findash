import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
    const newCategoriesList = [
        "РЕЦЕПЦИЯ БРОЙ", "РЕЦЕПЦИЯ БЕЗ КЛОК-ПРИЯТЕЛИ", "РЕСТОРАНТ ИЗХРАНВАНЕ", "ОБОРОТ БАР ТЕРИТОРИЯ", "ФИТНЕС",
        "УБОРКА ДОП.АПАРТАМЕНТИ", "ПРАНЕ", "ПРАЗНО", "ОСИГУРОВКИ", "ИЗТЕГЛЕНИ", "ТОК", "ВОДА", "ТЕЛЕНОР", "ИНТЕРНЕТ",
        "СЧУПЕНИ,ЛИПСИ И НАЕМИ ЗА АРЕДНИ АПАРТАМЕНТИ", "ГРИВНИ", "ПЛАЖ ЗЛАТНИ ПЯСЪЦИ-КАРТИ", "ДРУГИ ПРИХОДИ",
        "ЗАПЛАТА М.12/2025", "ПЪТНИ М.01", "ПЪТНИ М.12/2025", "ОТПУСК 2025", "ОТПУСК 2026", "БОНУС 2026 И РД ПОДАРЪЦИ",
        "ДОКАРАН ПЕРСОНАЛ", "РАБОТНО ОБЛЕКЛО", "ЛЕКАРСТВА И ЛЕКАРИ -ПЕРСОНАЛ", "ОБЗАВЕЖДАНЕ АРЕНДНИ АПАРТАМЕНТИ",
        "РЕМОНТИ АРЕНДНИ АПАРТАМЕНТИ", "ПОДДРЪЖКА СЛУЖЕБНИ НА КОЛИ (РЕМОНТИ, ГРАЖДАСНКИ, ПРЕГЛЕДИ)", "РЕМОНТ И ПОДДРЪЖКА РЕСТОРАНТ",
        "КОНСУМАТИВИ РЕСТOРАНТ (ВЪГЛЕЩА И ДР.)", "ИНВЕНТАР РЕСТОРАНТ", "АРОМАТИЗАТОРИ", "КАНЦЕЛЯРСКИ МАТЕРИАЛИ(ВИЗИТКИ, ТАБЕЛКИ, РЕКЛАМНИ ПЕЧАТИ)",
        "ЕКОНТ И ДРУГИ ДОСТАВКИ", "РЕБЛС ПЛАЖ РАСХОДИ", "РЕБЛС ПЛАЖ- КАРТИ", "РЕСТОРАНТ ХРАНА", "РЕСТОРАНТ НАПИТКИ",
        "ТАКСА СЧЕТОВОДСТВО", "АРЕНДА 2026", "ЕДУАРД", "ЕРИК", "ВНАСЯНЕ ПО СМЕТКАТА", "ЗАЕМ ЗА КРЕДИТ ВИТА 2007",
        "ЗАЕМ ЗА ОКТРАНСФЕР ВНОСКИ", "ДОП Ф-РИ", "ЕТ ФИРМИ", "БОНА ВИТА АПАРТАМЕНТИ ПЕРСОНАЛ", "ДРУГИ РАСХОДИ",
        "КЛИНИКА", "ЗА УТОЧНЕНИЕ КЪМ КОЕ ЗВЕНО", "СТРОИТЕЛСТВО ВИНИЦА"
    ];

    // Ensure array values are unique
    const uniqueCategories = [...new Set(newCategoriesList)];

    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [categories, setCategories] = useState({
        income: uniqueCategories,
        expense: uniqueCategories
    });
    const [loading, setLoading] = useState(true);

    // Sync Data with Firestore
    useEffect(() => {
        // 1. Sync Transactions
        const q = query(collection(db, 'transactions'));
        const unsubscribeTransactions = onSnapshot(q, (querySnapshot) => {
            const transArray = [];
            querySnapshot.forEach((doc) => {
                transArray.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date descending
            setTransactions(transArray.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }, (error) => {
            console.error("Firestore Error:", error);
            if (error.message.includes('PERMISSION_DENIED')) {
                alert("Database Connection Error: Please ensure Cloud Firestore is enabled in your Firebase Console and the Security Rules allow reads/writes.");
            }
        });

        // 2. Sync Categories Array (we'll store it as a single document for simplicity)
        const unsubCategories = onSnapshot(doc(db, 'settings', 'categories'), (docSnap) => {
            const data = docSnap.data();
            // Force update to the new combined Bulgarian list if it doesn't have the new keys yet
            if (docSnap.exists() && data && data.income && data.income.includes("РЕЦЕПЦИЯ БРОЙ")) {
                setCategories(data);
            } else {
                // Overwrite with the new combined list
                setDoc(doc(db, 'settings', 'categories'), { income: uniqueCategories, expense: uniqueCategories });
            }
            setLoading(false);
        });

        // 3. Sync Invoices
        const unsubInvoices = onSnapshot(collection(db, 'invoices'), (querySnapshot) => {
            const invoicesArray = [];
            querySnapshot.forEach((doc) => {
                invoicesArray.push({ id: doc.id, ...doc.data() });
            });
            setInvoices(invoicesArray.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)));
        });

        return () => {
            unsubscribeTransactions();
            unsubCategories();
            unsubInvoices();
        };
    }, []); // Run once on mount

    const addTransaction = async (transaction) => {
        try {
            await addDoc(collection(db, 'transactions'), transaction);
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Failed to save transaction: " + e.message);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'transactions', id));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    };

    const addCategory = async (type, name) => {
        if (!categories[type].includes(name)) {
            const newCategories = {
                ...categories,
                [type]: [...categories[type], name]
            };
            await setDoc(doc(db, 'settings', 'categories'), newCategories);
        }
    };

    const deleteCategory = async (type, name) => {
        const newCategories = {
            ...categories,
            [type]: categories[type].filter(c => c !== name)
        };
        await setDoc(doc(db, 'settings', 'categories'), newCategories);
    };

    const addInvoice = async (invoice) => {
        try {
            await addDoc(collection(db, 'invoices'), invoice);
        } catch (e) {
            console.error("Error adding invoice: ", e);
            alert("Failed to save invoice: " + e.message);
        }
    };

    const updateInvoice = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'invoices', id), updatedData);
        } catch (e) {
            console.error("Error updating invoice: ", e);
            alert("Failed to update invoice: " + e.message);
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await deleteDoc(doc(db, 'invoices', id));
        } catch (e) {
            console.error("Error deleting invoice: ", e);
        }
    };

    // Helper selectors
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netProfit = totalIncome - totalExpense;

    return (
        <FinanceContext.Provider value={{
            transactions,
            categories,
            invoices,
            addTransaction,
            deleteTransaction,
            addCategory,
            deleteCategory,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            totalIncome,
            totalExpense,
            netProfit
        }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => useContext(FinanceContext);
