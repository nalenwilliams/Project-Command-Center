// /test/connection.js
import fetch from 'node-fetch'
const API = process.env.APP_BASE_URL || 'http://localhost:3001'
async function runTests() {
  console.log('🔍 Testing WDL AI Core...')
  try {
    const health = await fetch(`${API}/health`).then(r => r.json())
    console.log('✅ Health:', health)
    const chat = await fetch(`${API}/ai/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: 'Say hello from WDL AI Core.' }) }).then(r => r.json())
    console.log('💬 Chat OK:', !!chat.reply)
    console.log('✅✅ All systems OK.')
  } catch (e) { console.error('❌ Test failed:', e.message) }
}
runTests()
