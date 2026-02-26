import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to sign in: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>

            {/* Left Branding Panel - Hidden on Small Screens */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                    flex: 1,
                    display: typeof window !== 'undefined' && window.innerWidth > 768 ? 'flex' : 'none',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '4rem',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)'
                }}
            >
                {/* Decorative Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    opacity: 0.5,
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--success-color)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Enterprise Grade Security</span>
                    </div>

                    <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 700 }}>
                        <span style={{ color: 'white' }}>Manage your</span><br />
                        <span className="text-gradient">finances</span><br />
                        <span style={{ color: 'white' }}>at lightspeed.</span>
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        FinDash provides a lightning-fast, highly secure dashboard to track transactions, manage payroll, and analyze your growth effortlessly.
                    </p>
                </div>
            </motion.div>

            {/* Right Login Form Panel */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                position: 'relative',
                zIndex: 1
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="glass-panel"
                    style={{
                        padding: '3rem',
                        width: '100%',
                        maxWidth: '440px',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
                            €
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Enter your credentials to access your dashboard</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}
                        >
                            <ShieldCheck size={16} />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="input"
                                    required
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        paddingLeft: '2.75rem',
                                        height: '48px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    className="input"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        paddingLeft: '2.75rem',
                                        height: '48px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                height: '48px',
                                justifyContent: 'center',
                                marginTop: '1rem',
                                fontSize: '1rem',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    Sign In <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};
