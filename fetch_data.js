const https = require('https');
const fs = require('fs');

fs.writeFileSync('debug.log', 'Script started\n');

const url = "https://api-us.communico.co/v2/faylib/assetbooking/group/3581?date=2025-12-16&assetType=INPERSON&multiplier=1";

https.get(url, (res) => {
    fs.appendFileSync('debug.log', `Response received: ${res.statusCode}\n`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('api_response.json', data);
        fs.appendFileSync('debug.log', 'Data written to api_response.json\n');
        console.log('Data written to api_response.json');
    });
}).on('error', (err) => {
    fs.appendFileSync('debug.log', `Error: ${err.message}\n`);
    console.error('Error: ' + err.message);
});
