import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';

export const Spreadsheet = () => {
    const { t } = useTranslation();

    // The embed URL goes here. We'll set a placeholder for now until the user provides one.
    // Example Google Sheets: 'https://docs.google.com/spreadsheets/d/e/.../pubhtml?widget=true&headers=false'
    // Example Microsoft Excel: 'https://onedrive.live.com/embed?resid=...&authkey=...&em=2&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True'
    const embedUrl = ''; // Default empty

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t('spreadsheet.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('spreadsheet.subtitle')}</p>
                </div>
            </div>

            <motion.div
                className="glass-panel"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: 0
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="yes"
                        style={{ background: 'white' }}
                        title="Embedded Spreadsheet"
                    ></iframe>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem',
                        textAlign: 'center'
                    }}>
                        <FileSpreadsheet size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{t('spreadsheet.noLinkTitle')}</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>{t('spreadsheet.noLinkDesc')}</p>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>How to embed your spreadsheet:</h3>
                            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li><strong>Google Sheets:</strong> Go to File {'>'} Share {'>'} Publish to web. Choose "Embed", click Publish, and copy the link inside `src="..."`.</li>
                                <li><strong>Excel Online:</strong> Go to File {'>'} Share {'>'} Embed. Copy the link in the `src="..."` attribute of the embed code.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
