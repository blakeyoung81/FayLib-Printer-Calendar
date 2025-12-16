const https = require('https');
const fs = require('fs');

const url = "https://api-us.communico.co/v2/faylib/assetbooking/group/3581?date=2025-12-17&assetType=INPERSON&multiplier=1";

https.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        fs.writeFileSync('full_asset_data.json', JSON.stringify(json, null, 2));
        console.log('Data saved to full_asset_data.json');
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
