'use client';

import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import AssetFilter from '../components/AssetFilter';
import { ASSETS, fetchAllAssetsAvailability, AssetAvailability } from './utils/api';
import styles from './page.module.css';

export default function Home() {
    // Default to selecting "3D Printers" initially
    const [selectedAssets, setSelectedAssets] = useState<string[]>(
        ASSETS.filter(a => a.category === '3D Printers').map(a => a.id)
    );
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availability, setAvailability] = useState<AssetAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [requireAllAvailable, setRequireAllAvailable] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch for the start of the current month
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const startDate = new Date(year, month, 1).toISOString().split('T')[0];

                const data = await fetchAllAssetsAvailability(selectedAssets, startDate);
                setAvailability(data);
            } catch (error) {
                console.error('Failed to fetch availability:', error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedAssets.length > 0) {
            fetchData();
        } else {
            setAvailability([]);
        }
    }, [currentDate, selectedAssets]);

    const handleToggleAsset = (assetId: string) => {
        setSelectedAssets(prev =>
            prev.includes(assetId)
                ? prev.filter(id => id !== assetId)
                : [...prev, assetId]
        );
    };

    return (
        <main className={styles.main}>
            <div className={styles.background} />
            <div className={styles.content}>
                <header className={styles.header}>
                    <h1 className={styles.title}>FayLib Equipment Calendar</h1>
                    <p className={styles.subtitle}>Consolidated availability for all FabLab equipment</p>
                </header>

                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        <AssetFilter
                            selectedAssets={selectedAssets}
                            onToggleAsset={handleToggleAsset}
                        />

                        <div className={styles.filterOptions}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={requireAllAvailable}
                                    onChange={(e) => setRequireAllAvailable(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span>Same Time Availability</span>
                            </label>
                            <p className={styles.toggleHint}>Only show slots where ALL selected items are available.</p>
                        </div>
                    </aside>

                    <section className={styles.calendarSection}>
                        {loading && <div className={styles.loading}>Loading availability...</div>}
                        <Calendar
                            availability={availability}
                            currentDate={currentDate}
                            onMonthChange={setCurrentDate}
                            requireAllAvailable={requireAllAvailable}
                        />
                    </section>
                </div>
            </div>
        </main>
    );
}
