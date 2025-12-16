import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('u');
    const pin = searchParams.get('p');

    if (!barcode || !pin) {
        return NextResponse.json({ error: 'Missing barcode or pin' }, { status: 400 });
    }

    // Communico API endpoint for patron sign-in
    // https://api-us.communico.co/v1/faylib/patron?u={barcode}&p={pin}&type=schedule
    const apiUrl = `https://api-us.communico.co/v1/faylib/patron?u=${barcode}&p=${pin}&type=schedule`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            },
            method: "GET"
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error signing in patron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
