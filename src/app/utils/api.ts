export interface Asset {
    id: string;
    name: string;
    category: string;
}

export const ASSETS: Asset[] = [
    // 3D Printers
    { id: '3581', name: '3D Printer: Bambu Lab X1-C', category: '3D Printers' },
    { id: '3764', name: '3D Printer: Bambu Lab A1 mini', category: '3D Printers' },
    { id: '3994', name: '3D Printer: Bambu Lab H2D', category: '3D Printers' },

    // 3D Scanners
    { id: '3765', name: '3D Scanner: Revopoint POP', category: '3D Scanners' },
    { id: '3931', name: '3D Scanner: iPad Pro w/ LiDAR', category: '3D Scanners' },

    // Laser & CNC
    { id: '2797', name: 'Laser: Epilog Zing 24', category: 'Laser & CNC' },
    { id: '2798', name: 'Laser: Glowforge Pro', category: 'Laser & CNC' },
    { id: '3552', name: 'CNC: Nomad 3', category: 'Laser & CNC' },

    // Vinyl & Printing
    { id: '2542', name: 'Cricut Vinyl Cutter', category: 'Vinyl & Printing' },
    { id: '2803', name: 'Roland Vinyl Printer/Cutter', category: 'Vinyl & Printing' },
    { id: '2540', name: 'Large Format Printer: Epson T5170', category: 'Vinyl & Printing' },
    { id: '3574', name: 'Sublimation Printer: Epson F170', category: 'Vinyl & Printing' },

    // Textiles
    { id: '3421', name: 'Embroidery Machine: Brother PE545', category: 'Textiles' },
    { id: '3422', name: 'Sewing Machine: Singer Heavy Duty 6800C', category: 'Textiles' },
    { id: '2871', name: 'Heat Press: A2Z Swing Away', category: 'Textiles' },

    // Other
    { id: '2888', name: 'Vacuum Former: Mayku FormBox', category: 'Other' },
    { id: '3578', name: 'Button Maker: 1.25', category: 'Other' },
];

export interface AvailabilitySlot {
    date: string; // YYYY-MM-DD
    hour: number; // 0-23
    available: boolean;
}

export interface AssetAvailability {
    assetId: string;
    slots: AvailabilitySlot[];
}

export async function fetchAssetAvailability(assetId: string, startDate: string): Promise<AssetAvailability> {
    // Fetch 5 weeks of data to cover a full month view
    // The API returns 1 week (7 days) per call.
    const weeksToFetch = 5;
    const promises = [];

    const start = new Date(startDate);

    for (let i = 0; i < weeksToFetch; i++) {
        const currentWeekStart = new Date(start);
        currentWeekStart.setDate(start.getDate() + (i * 7));
        const dateStr = currentWeekStart.toISOString().split('T')[0];

        promises.push(
            fetch(`/api/availability?printerId=${assetId}&date=${dateStr}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch`);
                    return res.json();
                })
                .catch(err => {
                    console.error(`Error fetching week ${i} for asset ${assetId}`, err);
                    return null;
                })
        );
    }

    const responses = await Promise.all(promises);
    const allSlots: AvailabilitySlot[] = [];

    responses.forEach((data, weekIndex) => {
        if (!data || !data.data || !data.data.assets || !data.data.assets[0]) return;

        const availabilityGrid = data.data.assets[0].availability;
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (weekIndex * 7));

        availabilityGrid.forEach((daySlots: boolean[], dayIndex: number) => {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + dayIndex);
            const dateStr = currentDate.toISOString().split('T')[0];

            daySlots.forEach((isAvailable: boolean, hour: number) => {
                // Avoid duplicates if weeks overlap (though simply adding 7 days shouldn't overlap)
                // But let's check if we already have this slot just in case
                // Actually, simple push is faster, we can filter later if needed.
                allSlots.push({
                    date: dateStr,
                    hour: hour,
                    available: isAvailable,
                });
            });
        });
    });

    return {
        assetId,
        slots: allSlots,
    };
}

export async function fetchAllAssetsAvailability(assetIds: string[], startDate: string): Promise<AssetAvailability[]> {
    // Limit concurrency to avoid hitting rate limits too hard?
    // For now, Promise.all is fine for ~10-20 requests * 5 weeks = 100 requests.
    // Browser might limit parallel connections.
    // Let's batch them if needed, but for now try direct.
    const promises = assetIds.map(id => fetchAssetAvailability(id, startDate));
    return Promise.all(promises);
}
