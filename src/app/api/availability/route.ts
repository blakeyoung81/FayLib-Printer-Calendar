import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const printerId = searchParams.get('printerId');

  if (!date || !printerId) {
    return NextResponse.json({ error: 'Missing date or printerId' }, { status: 400 });
  }

  // Communico API endpoint
  // Example: https://api-us.communico.co/v2/faylib/assetbooking/group/3764?date=2025-12-16&assetType=INPERSON&multiplier=1
  const apiUrl = `https://api-us.communico.co/v2/faylib/assetbooking/group/${printerId}?date=${date}&assetType=INPERSON&multiplier=1`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API responded with ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
