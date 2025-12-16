import React, { useState } from 'react';
import { ASSETS } from '../app/utils/api';
import styles from './AssetFilter.module.css';

interface AssetFilterProps {
    selectedAssets: string[];
    onToggleAsset: (assetId: string) => void;
}

export default function AssetFilter({ selectedAssets, onToggleAsset }: AssetFilterProps) {
    // Group assets by category
    const categories = ASSETS.reduce((acc, asset) => {
        if (!acc[asset.category]) {
            acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
    }, {} as Record<string, typeof ASSETS>);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        '3D Printers': true,
        '3D Scanners': false,
        'Laser & CNC': false,
        'Vinyl & Printing': false,
        'Textiles': false,
        'Other': false,
    });

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const toggleAllInCategory = (category: string, assets: typeof ASSETS) => {
        const allSelected = assets.every(a => selectedAssets.includes(a.id));
        if (allSelected) {
            // Deselect all
            assets.forEach(a => {
                if (selectedAssets.includes(a.id)) onToggleAsset(a.id);
            });
        } else {
            // Select all
            assets.forEach(a => {
                if (!selectedAssets.includes(a.id)) onToggleAsset(a.id);
            });
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Equipment</h2>

            {Object.entries(categories).map(([category, assets]) => (
                <div key={category} className={styles.categoryGroup}>
                    <div className={styles.categoryHeader}>
                        <button
                            className={styles.expandButton}
                            onClick={() => toggleCategory(category)}
                        >
                            {expandedCategories[category] ? '▼' : '▶'} {category}
                        </button>
                        <button
                            className={styles.selectAllButton}
                            onClick={() => toggleAllInCategory(category, assets)}
                        >
                            {assets.every(a => selectedAssets.includes(a.id)) ? 'None' : 'All'}
                        </button>
                    </div>

                    {expandedCategories[category] && (
                        <div className={styles.list}>
                            {assets.map((asset) => (
                                <label key={asset.id} className={styles.item}>
                                    <input
                                        type="checkbox"
                                        checked={selectedAssets.includes(asset.id)}
                                        onChange={() => onToggleAsset(asset.id)}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.name}>{asset.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
