import React, { useState } from 'react';
import styles from './BookingModal.module.css';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    slot: number; // Hour 0-23
    selectedAssets: {
        groupName: string;
        groupId: string;
        assetIds: string[]; // Specific available asset IDs to book
    }[];
}

export default function BookingModal({ isOpen, onClose, date, slot, selectedAssets }: BookingModalProps) {
    const [step, setStep] = useState<'login' | 'confirm' | 'success' | 'error'>('login');
    const [barcode, setBarcode] = useState('');
    const [pin, setPin] = useState('');
    const [agreedCost, setAgreedCost] = useState(false);
    const [agreedTraining, setAgreedTraining] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [patronData, setPatronData] = useState<any>(null);
    const [bookingResults, setBookingResults] = useState<{ name: string, success: boolean, msg?: string }[]>([]);

    if (!isOpen) return null;

    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch(`/api/patron?u=${barcode}&p=${pin}`);
            const data = await res.json();

            if (res.ok && data.error === undefined && (!data.data.blockData || data.data.blockData.result === 'ok')) {
                setPatronData(data);
                setStep('confirm');
            } else {
                setErrorMsg(data.error || data.data?.blockData?.message || 'Invalid library card or PIN.');
            }
        } catch (err) {
            setErrorMsg('Failed to connect to library system.');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!agreedCost || !agreedTraining) {
            setErrorMsg("Please agree to the required terms.");
            return;
        }

        setLoading(true);
        const results = [];

        // IDs from research
        const CLIENT_ID = 368;
        const LOCATION_ID = 36;
        const CATEGORY_ID = 609;

        // Construct booking time
        // date is YYYY-MM-DD
        // slot is hour (0-23)
        // start_time format: YYYY-MM-DD HH:mm
        const startTime = `${date} ${slot.toString().padStart(2, '0')}:00`;

        for (const assetGroup of selectedAssets) {
            if (assetGroup.assetIds.length === 0) continue;

            const specificAssetId = assetGroup.assetIds[0]; // Book the first available one in the group

            // Construct patron_data matching the application's structure
            // The official app fetches holds, checkouts, and fines. We will try sending empty arrays
            // as we don't need to display them, but the server might expect the structure.
            const patronPayload = {
                patron: { barcode: barcode },
                holds: [],
                checkouts: [],
                fines: []
            };

            // Construct custom questions
            // derived from full_asset_data.json
            const customQuestions = {
                "field_RFJLWgtS": agreedCost ? "Yes" : "No",
                "field_ozMFFjbX": agreedTraining ? "Yes" : "No",
                "field_AyNGUYSO": "" // Optional late arrival field, left empty
            };

            const payload = {
                client_id: CLIENT_ID,
                location_id: LOCATION_ID,
                category_id: CATEGORY_ID,
                group_id: assetGroup.groupId,
                asset_id: specificAssetId,
                start_time: startTime,
                slot: slot, // Slot index (hour for 60min blocks)
                booking_length: 60,
                first_name: patronData.data.names[0].first_name,
                last_name: patronData.data.names[0].last_name,
                email: patronData.data.emails?.[0] || '',
                cell: patronData.data.phones?.[0] || '',
                custom_questions: JSON.stringify(customQuestions),
                patron_data: JSON.stringify(patronPayload),
                booking_source: "WEB_V1",
                availability_type: "INPERSON"
            };

            try {
                const res = await fetch('/api/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const responseData = await res.json();

                if (res.ok && responseData.status === 'success') {
                    results.push({ name: assetGroup.groupName, success: true });
                } else {
                    let msg = responseData.message || 'Failed';
                    if (msg === 'assets.booking.nolongeravailable') {
                        msg = "Booking failed. Use Limit Reached: You may only have one active 3D printer reservation at a time.";
                    }
                    results.push({ name: assetGroup.groupName, success: false, msg });
                }
            } catch (err: any) {
                results.push({ name: assetGroup.groupName, success: false, msg: err.message });
            }
        }

        setBookingResults(results);
        setStep('success');
        setLoading(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>

                {step === 'login' && (
                    <form onSubmit={handleLogin} className={styles.form}>
                        <h3>Log in to Book</h3>
                        <p>{formattedDate} at {slot}:00</p>
                        <p className={styles.subtitle}>Enter your library details to continue.</p>

                        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

                        <div className={styles.field}>
                            <label>Library Card Number</label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                                placeholder="2100..."
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>PIN</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="****"
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 'confirm' && (
                    <div className={styles.confirm}>
                        <h3>Confirm Booking</h3>
                        <p><strong>Name:</strong> {patronData.data.names[0].first_name} {patronData.data.names[0].last_name}</p>
                        <p><strong>Email:</strong> {patronData.data.emails?.[0]}</p>

                        <div className={styles.assetsList}>
                            <h4>Items to Book:</h4>
                            <ul>
                                {selectedAssets.map(a => (
                                    <li key={a.groupId}>
                                        {a.groupName}
                                        {a.assetIds.length === 0 && <span className={styles.unavailable}> (No slot available)</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.agreements}>
                            {errorMsg && <div className={styles.error}>{errorMsg}</div>}
                            <div className={styles.checkboxField}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={agreedCost}
                                        onChange={e => setAgreedCost(e.target.checked)}
                                    />
                                    I understand that I will be charged for the cost of printing ($0.05/g PLA, $0.07/g Composite).
                                </label>
                            </div>
                            <div className={styles.checkboxField}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={agreedTraining}
                                        onChange={e => setAgreedTraining(e.target.checked)}
                                    />
                                    I have completed the 3D print learning lab and feel confident using the machines.
                                </label>
                            </div>
                        </div>

                        <button className={styles.submitBtn} onClick={handleBook} disabled={loading}>
                            {loading ? 'Booking...' : (selectedAssets.length > 1 ? 'Book All Items' : 'Book Item')}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className={styles.result}>
                        <h3>Booking Results</h3>
                        <ul>
                            {bookingResults.map((res, i) => (
                                <li key={i} className={res.success ? styles.successItem : styles.errorItem}>
                                    {res.success ? '✅' : '❌'} <strong>{res.name}</strong>: {res.success ? 'Confirmed!' : res.msg}
                                </li>
                            ))}
                        </ul>
                        <button className={styles.submitBtn} onClick={onClose}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
