import React, { useState, useMemo } from 'react';
import { AssetAvailability, ASSETS } from '../app/utils/api';
import styles from './Calendar.module.css';

interface CalendarProps {
    availability: AssetAvailability[];
    currentDate: Date;
    onMonthChange: (date: Date) => void;
    requireAllAvailable?: boolean;
}

export default function Calendar({ availability, currentDate, onMonthChange, requireAllAvailable = false }: CalendarProps) {
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const getAvailabilityForDay = (dateStr: string) => {
        let totalSlots = 0;
        let availableSlots = 0;
        let assetsWithAvailability = 0;
        let totalAssets = availability.length;

        if (requireAllAvailable && totalAssets > 0) {
            // Logic for "Same Time": Only count slots where ALL assets are available
            // We need to check each hour (0-23)
            for (let hour = 0; hour < 24; hour++) {
                const allAvailable = availability.every(asset => {
                    const slot = asset.slots.find(s => s.date === dateStr && s.hour === hour);
                    return slot && slot.available;
                });

                if (allAvailable) {
                    availableSlots++;
                }
            }
            totalSlots = 24; // Fixed 24 hours in a day
            assetsWithAvailability = availableSlots > 0 ? totalAssets : 0; // If any slot is open for all, we say assets are available
        } else {
            // Standard logic: Aggregate all slots
            availability.forEach(asset => {
                let assetHasSlots = false;
                asset.slots.forEach(slot => {
                    if (slot.date === dateStr) {
                        totalSlots++;
                        if (slot.available) {
                            availableSlots++;
                            assetHasSlots = true;
                        }
                    }
                });
                if (assetHasSlots) assetsWithAvailability++;
            });
        }

        return { totalSlots, availableSlots, assetsWithAvailability, totalAssets };
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onMonthChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onMonthChange(newDate);
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.header}>
                <button onClick={handlePrevMonth} className={styles.navButton}>&lt;</button>
                <h2 className={styles.monthTitle}>{monthName}</h2>
                <button onClick={handleNextMonth} className={styles.navButton}>&gt;</button>
            </div>

            <div className={styles.grid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.dayHeader}>{day}</div>
                ))}

                {/* Empty cells for start of month */}
                {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className={styles.emptyCell} />
                ))}

                {daysInMonth.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const { totalSlots, availableSlots, assetsWithAvailability, totalAssets } = getAvailabilityForDay(dateStr);
                    const isSelected = selectedDay === dateStr;

                    // Determine status color
                    let statusClass = styles.statusNone;
                    if (totalSlots > 0) {
                        if (availableSlots === 0) statusClass = styles.statusFull;
                        else if (availableSlots < totalSlots * 0.1) statusClass = styles.statusLow;
                        else statusClass = styles.statusGood;
                    }

                    return (
                        <div
                            key={dateStr}
                            className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${statusClass}`}
                            onClick={() => setSelectedDay(dateStr)}
                        >
                            <span className={styles.dayNumber}>{date.getDate()}</span>
                            {totalSlots > 0 && (
                                <div className={styles.availabilityInfo}>
                                    <div>{assetsWithAvailability}/{totalAssets} Open</div>
                                    <div className={styles.slotCount}>{availableSlots} slots</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDay && (
                <div className={styles.detailsPanel}>
                    <div className={styles.detailsHeader}>
                        <h3>Availability for {selectedDay}</h3>
                        <button className={styles.closeButton} onClick={() => setSelectedDay(null)}>Close</button>
                    </div>
                    <div className={styles.detailsGrid}>
                        {availability.map(asset => {
                            const daySlots = asset.slots.filter(s => s.date === selectedDay);
                            if (daySlots.length === 0) return null;

                            const assetName = ASSETS.find(a => a.id === asset.assetId)?.name || asset.assetId;
                            const isAvailable = daySlots.some(s => s.available);

                            return (
                                <div key={asset.assetId} className={`${styles.printerColumn} ${!isAvailable ? styles.columnFull : ''}`}>
                                    <h4>{assetName}</h4>
                                    <div className={styles.slotsList}>
                                        {daySlots.map(slot => (
                                            <div key={slot.hour} className={`${styles.slot} ${slot.available ? styles.slotAvailable : styles.slotBusy}`}>
                                                {slot.hour}:00 - {slot.available ? 'Open' : 'Booked'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
