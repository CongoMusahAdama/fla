
const http = require('http');

http.get('http://127.0.0.1:3001/api/products?showAll=true', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
