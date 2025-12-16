import React from 'react';
import { PRINTERS } from '../app/utils/api';
import styles from './PrinterFilter.module.css';

interface PrinterFilterProps {
    selectedPrinters: string[];
    onTogglePrinter: (printerId: string) => void;
}

export default function PrinterFilter({ selectedPrinters, onTogglePrinter }: PrinterFilterProps) {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Select Printers</h2>
            <div className={styles.list}>
                {PRINTERS.map((printer) => (
                    <label key={printer.id} className={styles.item}>
                        <input
                            type="checkbox"
                            checked={selectedPrinters.includes(printer.id)}
                            onChange={() => onTogglePrinter(printer.id)}
                            className={styles.checkbox}
                        />
                        <span className={styles.name}>{printer.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
