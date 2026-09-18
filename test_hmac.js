const crypto = require('crypto');
const botToken = '8400954528:AAFSgBJyWAbAFUa9I_r5FBPmkDBHXW_Ures';
const initData = 'user=%7B%22id%22%3A123%7D&auth_date=123&hash=abc';

const urlParams = new URLSearchParams(initData);
const hash = urlParams.get('hash');
urlParams.delete('hash');

const params = Array.from(urlParams.entries());
params.sort((a, b) => a[0].localeCompare(b[0]));
const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

console.log(calculatedHash);
