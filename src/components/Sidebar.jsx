import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, FileText, Tags, LogOut, Menu, X, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Sidebar = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'bg' : 'en';
        i18n.changeLanguage(newLang);
    };

    const navItems = [
        { name: t('sidebar.dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
        { name: t('sidebar.transactions'), path: '/transactions', icon: <Receipt size={20} /> },
        { name: t('sidebar.invoices'), path: '/invoices', icon: <FileText size={20} /> },
        { name: t('sidebar.spreadsheet'), path: '/spreadsheet', icon: <FileSpreadsheet size={20} /> },
        { name: t('sidebar.categories'), path: '/categories', icon: <Tags size={20} /> },
    ];

    const SidebarContent = () => (
        <>
            <div style={{ marginBottom: '3rem', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="text-gradient" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white' }}>
                        $
                    </div>
                    FinDash
                </h1>
                {/* Mobile Close Button */}
                <button className="btn-icon mobile-only" onClick={() => setIsOpen(false)} style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none' }}>
                    <X size={24} />
                </button>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                            textDecoration: 'none',
                            fontWeight: 500,
                            transition: 'var(--transition)'
                        })}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--panel-border)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    className="btn btn-outline"
                    onClick={toggleLanguage}
                    style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--panel-border)', color: 'var(--text-secondary)' }}
                >
                    {i18n.language === 'en' ? '🇧🇬 Български' : '🇺🇸 English'}
                </button>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: 'var(--text-muted)' }}>
                    <LogOut size={20} />
                    {t('sidebar.signOut')}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="mobile-header" style={{
                display: 'none', // Overridden in CSS for mobile
                padding: '1rem',
                borderBottom: '1px solid var(--panel-border)',
                background: 'var(--bg-darker)',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <h1 className="text-gradient" style={{ fontSize: '1.25rem', margin: 0 }}>FinDash</h1>
                <button className="btn-icon" onClick={() => setIsOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <div className="glass-panel desktop-sidebar" style={{
                width: '260px',
                height: 'calc(100vh - 4rem)',
                margin: '2rem 0 2rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1rem',
                position: 'sticky',
                top: '2rem'
            }}>
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 50,
                            background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)',
                            display: 'flex'
                        }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                width: '280px',
                                background: 'var(--panel-bg)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1.5rem 1rem',
                                borderRight: '1px solid var(--panel-border)',
                                boxShadow: 'var(--shadow-panel)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SidebarContent />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
