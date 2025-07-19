require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

sendEmail(
  'harshpatidar242004@gmail.com',
  'Test Email',
  '<h1>This is a test</h1><p>Sent from Job Portal</p>'
)
  .then(() => console.log('✅ Test email sent'))
  .catch((err) => console.error('❌ Test email failed:', err));
