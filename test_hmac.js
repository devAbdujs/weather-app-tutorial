const crypto = require('crypto');
// From telegram docs example:
const botToken = '8400954528:AAFSgBJyWAbAFUa9I_r5FBPmkDBHXW_Ures'; // dummy token

// Option 1: Key is WebAppData, Data is botToken
const sk1 = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest('hex');

// Option 2: Key is botToken, Data is WebAppData
const sk2 = crypto.createHmac('sha256', botToken).update('WebAppData').digest('hex');

console.log("SK1 (Key=WebAppData, Data=botToken):", sk1);
console.log("SK2 (Key=botToken, Data=WebAppData):", sk2);
