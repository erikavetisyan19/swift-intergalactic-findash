import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
    const newCategoriesList = [
        "НОЩУВКИ", "НОЩУВКИ приятели, през офис", "РЕСТОРАНТ ИЗХРАНВАНЕ", "ОБОРОТ БАР ТЕРИТОРИЯ", "ФИТНЕС",
        "УБОРКА СОБСТВЕНИЦИ ДОПОЛНИТЕНО", "СЧУПЕЧНИ, ЛИПСИ, НАЕМИ", "ПАРКИНГ-ПРИХОД РЕЦЕПЦИЯ, АБОНАМЕНТ-РАСХОД",
        "ДРУГИ ПРИХОДИ- ДРУГИ РАСХОДИ", "МАРНО ООД", "ДЕС МЕНЕДМЕНТ комисион", "BOOKING комисиона",
        "РЕКЛАМА -през ДЕС МЕНЕДЖМЪНТ", "РЕКЛАМА FACEBOOK, GOOGLE", "КРЕАТО ПРОГРАМА РЕЦЕПЦИЯ +(ДОМЕЙНИ, ПОЩИ)",
        "ДДС", "ДОП.Ф-РИ", "Турестически данък", "ДРУГИ ДАНЪЦИ", "ТАКСА ПОСТЕРМИНАЛ", "БАНКОВИ ТАКСИ-ПРЕВОД, МЕСЕЧНИ ТАКСИ",
        "ТАКСА СЧЕТОВОДСТВО", "ОСИГУРОВКИ", "ДОКАРАН ПЕРСОНАЛ (КОМИСИОН, ПЪТНИ И ДОКУМЕНТИ)", "ПЪТНИ (ГРАДСКИ ТРАНСПОРТ, ТАКСИ, КАРТИ)",
        "ОТПУСКИ 2025, 2026", "БОНУСИ, ПОДАРЪЦИ ЗА РД", "ЛЕКАРИ И ПРЕГЛЕДИ НА ПЕРСОНАЛ+МЕД.КНИЖКИ", "УНИФОРМИ",
        "ТОК", "ВОДА", "ТЕЛЕФОНИ (ЙЕТТЕЛ ПО Ф-РИ)", "ИНТЕРНЕТ A1", "ПОДДРЪЖКА КИРО", "СОТ", "ГАЗ", "ПРАНЕ", "ГРИВНИ",
        "ЕКОНТ, СПИДИ И ДРУГИ ДОСТАВКИ", "КАНЦЕЛЯРСКИ МАТЕРИАЛИ, ВИЗИТКИ, ТАБЕЛИ И ПЕЧАТИ", "ХРАНА РЕСТОРАНТ",
        "НАПИТКИ РЕСТОРАНТ", "КОНСУМАТИВИ ХОТЕЛ",
        "ТАКСИ,ГЛОБИ,ЛИЦЕНЗИ(ХАСИП СИСТЕМА, ПРОФОН, МУЗИКАУТОР,ДОКУМЕНТИ, КАСОВИ АПАРАТИ, СКЕНЕР РЕЦЕПЦИЯ)",
        "АРОМАТИЗАТОРИ", "РЕМОНТИ И ПОДДРЪЖКА В РЕСТОРАНТ", "ИНВЕНТАР РЕСТОРАНТ", "КОНСУМАТИВИ РЕСТОРАНТ ( ВЪГЛЕЩА И ДРУГИ)",
        "РЕМОНТИ АРЕНДНИ АПАРТАМЕНТИ", "ОБЗАВЕЖДАНЕ АРЕНДНИ АПАРТАМЕНТИ", "РЕМОНТИ ПЕРСОНАЛСКИ СТАИ БОНА ВИТА",
        "ПОДДРЪЖКА СЛУЖЕБНИ НА КОЛИ (РЕМОНТИ, ГРАЖДАСНКИ, ПРЕГЛЕДИ)", "ЗАДЪЛЖЕНИЯ ОТ МИНАЛИ ГОДИНИ !!!!!",
        "МАРНО ООД ДЪЛГ 2024,2025", "КАРТИ ПЛАЖ РЕБЛС", "ПЛАЖ РЕБЛС РАСХОДИ",
        "ЗАПЛАТА УПРАВИТЕЛИИ, ОФИС И ВОДИТЕЛЬ", "ЗАПЛАТИ РЕЦЕПЦИЯ", "ЗАПЛАТИ КАМЕРИЕРКИ",
        "ЗАПЛАТИ КУХНЯ", "ЗАПЛАТИ СЕРВИТЬОРИ,ЧЕКЪРИ,БАРМЕН", "ЗАПЛАТА СПАСИТЕЛИ", "ЗАПЛАТА АНИМАТОРИ"
    ];

    // Ensure array values are unique
    const uniqueCategories = [...new Set(newCategoriesList)];

    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
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

        const unsubCategories = onSnapshot(doc(db, 'settings', 'categories'), (docSnap) => {
            const data = docSnap.data();
            // Force update to the new combined Bulgarian list if it doesn't have the new keys yet
            if (docSnap.exists() && data && data.income && data.income.includes("НОЩУВКИ")) {
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

        // 4. Sync Employees
        const unsubEmployees = onSnapshot(collection(db, 'employees'), (querySnapshot) => {
            const employeesArray = [];
            querySnapshot.forEach((doc) => {
                employeesArray.push({ id: doc.id, ...doc.data() });
            });
            setEmployees(employeesArray.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        });

        // 5. Sync TimeLogs
        const unsubTimeLogs = onSnapshot(collection(db, 'timeLogs'), (querySnapshot) => {
            const timeLogsArray = [];
            querySnapshot.forEach((doc) => {
                timeLogsArray.push({ id: doc.id, ...doc.data() });
            });
            // Sort by month descending
            setTimeLogs(timeLogsArray.sort((a, b) => (b.month || '').localeCompare(a.month || '')));
        });

        return () => {
            unsubscribeTransactions();
            unsubCategories();
            unsubInvoices();
            unsubEmployees();
            unsubTimeLogs();
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

    const updateTransaction = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'transactions', id), updatedData);
        } catch (e) {
            console.error("Error updating transaction: ", e);
            alert("Failed to update transaction: " + e.message);
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

    // --- Payroll CRUD ---
    const addEmployee = async (employee) => {
        try {
            await addDoc(collection(db, 'employees'), employee);
        } catch (e) {
            console.error("Error adding employee: ", e);
            alert("Failed to add employee: " + e.message);
        }
    };

    const updateEmployee = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'employees', id), updatedData);
        } catch (e) {
            console.error("Error updating employee: ", e);
        }
    };

    const deleteEmployee = async (id) => {
        try {
            await deleteDoc(doc(db, 'employees', id));
        } catch (e) {
            console.error("Error deleting employee: ", e);
        }
    };

    const addTimeLog = async (log) => {
        try {
            await addDoc(collection(db, 'timeLogs'), log);
        } catch (e) {
            console.error("Error adding time log: ", e);
        }
    };

    const deleteTimeLog = async (id) => {
        try {
            await deleteDoc(doc(db, 'timeLogs', id));
        } catch (e) {
            console.error("Error deleting time log: ", e);
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
            employees,
            timeLogs,
            addTransaction,
            updateTransaction,
            deleteTransaction,
            addCategory,
            deleteCategory,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            addTimeLog,
            deleteTimeLog,
            totalIncome,
            totalExpense,
            netProfit
        }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => useContext(FinanceContext);
