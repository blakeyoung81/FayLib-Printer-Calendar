import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Communico API endpoint for booking
        // https://api-us.communico.co/v2/faylib/assetbooking/booking
        const apiUrl = `https://api-us.communico.co/v2/faylib/assetbooking/booking`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error booking asset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
