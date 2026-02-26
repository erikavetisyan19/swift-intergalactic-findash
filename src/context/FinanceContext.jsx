import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// eslint-disable-next-line react-refresh/only-export-components
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

    // Ensure array values are unique and memoized
    const uniqueCategories = useMemo(() => [...new Set(newCategoriesList)], [newCategoriesList]);

    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
    const [categories, setCategories] = useState({
        income: uniqueCategories,
        expense: uniqueCategories
    });

    // Sync Data with Firestore
    useEffect(() => {
        // 1. Sync Transactions (Limited to recent to save reads)
        const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(400));
        const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
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
        });

        // 3. Sync Invoices (Limited to recent)
        const qInvoices = query(collection(db, 'invoices'), orderBy('dueDate', 'desc'), limit(100));
        const unsubInvoices = onSnapshot(qInvoices, (querySnapshot) => {
            const invoicesArray = [];
            querySnapshot.forEach((doc) => {
                invoicesArray.push({ id: doc.id, ...doc.data() });
            });
            setInvoices(invoicesArray.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)));
        });

        // 4. Sync Employees (Limited to prevent unscalable reads)
        const qEmployees = query(collection(db, 'employees'), limit(300));
        const unsubEmployees = onSnapshot(qEmployees, (querySnapshot) => {
            const employeesArray = [];
            querySnapshot.forEach((doc) => {
                employeesArray.push({ id: doc.id, ...doc.data() });
            });
            setEmployees(employeesArray.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        });

        // 5. Sync TimeLogs (Limited to recent months)
        const qTimeLogs = query(collection(db, 'timeLogs'), orderBy('month', 'desc'), limit(300));
        const unsubTimeLogs = onSnapshot(qTimeLogs, (querySnapshot) => {
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
    }, [uniqueCategories]); // Run once on mount

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
            // Find the transaction before deleting to check if it's a payroll transaction
            const txnToDelete = transactions.find(t => t.id === id);

            if (txnToDelete && txnToDelete.description) {
                const desc = txnToDelete.description.toLowerCase();

                // Check if it's an advance payment: "Аванс: [Name] за [Month]"
                if (desc.includes('аванс:')) {
                    // Extract name and month. Format is usually "Аванс: Employee Name за YYYY-MM (в брой)"
                    const match = txnToDelete.description.match(/Аванс:\s*(.+?)\s*за\s*(\d{4}-\d{2})/i);
                    if (match) {
                        const empName = match[1].trim();
                        const month = match[2];
                        const emp = employees.find(e => e.name.toLowerCase() === empName.toLowerCase());

                        if (emp) {
                            const logToUpdate = timeLogs.find(l => l.employeeId === emp.id && l.month === month);
                            if (logToUpdate && logToUpdate.advances) {
                                const deletedAmount = parseFloat(txnToDelete.amount) || 0;
                                // We need to remove the deleted amount from the advances array
                                // Since advances are historically tracked as an array of objects { amount },
                                // we'll find the first advance that matches this amount and remove it,
                                // or adjust the total by creating a negative compensating entry if not exact match.

                                let newAdvances = [...logToUpdate.advances];
                                const exactMatchIdx = newAdvances.findIndex(a => Math.abs((parseFloat(a.amount) || 0) - deletedAmount) < 0.01);

                                if (exactMatchIdx !== -1) {
                                    newAdvances.splice(exactMatchIdx, 1);
                                } else {
                                    // Fallback: append a negative advance to balance it out
                                    newAdvances.push({ amount: -deletedAmount, date: new Date().toISOString() });
                                }

                                await updateDoc(doc(db, 'timeLogs', logToUpdate.id), { advances: newAdvances });
                            }
                        }
                    }
                }
                // Check if it's a full or remaining salary payment
                else if (desc.includes('пълно изплащане на заплата:') || desc.includes('изплатен остатък от заплата:')) {
                    const pattern = desc.includes('пълно')
                        ? /Пълно изплащане на заплата:\s*(.+?)\s*за\s*(\d{4}-\d{2})/i
                        : /Изплатен остатък от заплата:\s*(.+?)\s*за\s*(\d{4}-\d{2})/i;

                    const match = txnToDelete.description.match(pattern);
                    if (match) {
                        const empName = match[1].trim();
                        const month = match[2];
                        const emp = employees.find(e => e.name.toLowerCase() === empName.toLowerCase());

                        if (emp) {
                            const logToUpdate = timeLogs.find(l => l.employeeId === emp.id && l.month === month);
                            if (logToUpdate) {
                                await updateDoc(doc(db, 'timeLogs', logToUpdate.id), { isPaid: false });
                            }
                        }
                    }
                }
                // Check if it's a refunded advance adjustment
                else if (desc.includes('възстановен аванс:')) {
                    const match = txnToDelete.description.match(/Възстановен аванс:\s*(.+)/i);
                    // Without the explicit month in the description, we must assume current month or find the latest log
                    if (match) {
                        const empName = match[1].trim();
                        const emp = employees.find(e => e.name.toLowerCase() === empName.toLowerCase());

                        if (emp) {
                            // Find the most recent timeLog for this employee since month isn't explicitly in this description
                            const latestLog = timeLogs.filter(l => l.employeeId === emp.id).sort((a, b) => b.month.localeCompare(a.month))[0];
                            if (latestLog) {
                                let newAdvances = [...(latestLog.advances || [])];
                                // We are deleting a "refund", so we add the advance BACK to them
                                const amountToAddBack = parseFloat(txnToDelete.amount) || 0;
                                newAdvances.push({ amount: amountToAddBack, date: new Date().toISOString() });
                                await updateDoc(doc(db, 'timeLogs', latestLog.id), { advances: newAdvances });
                            }
                        }
                    }
                }
            }

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

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => useContext(FinanceContext);
