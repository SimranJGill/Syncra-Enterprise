import assert from 'assert';

const API_BASE = 'http://localhost:5000/api/v1';
let token = '';
let convId = null;

async function runTests() {
  console.log('--- STARTING DAY 8 INTEGRATION TESTS (MODULES 13-15) ---');

  try {
    // 1. Setup & Authenticate Admin
    const email = `admin_m13_${Date.now()}@wfm.com`;
    console.log('Registering Test Admin...');
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ops Manager',
        email,
        password: 'Password123!',
        role: 'Admin',
        organization: 'HQ',
        accessCode: 'ADMIN2026'
      })
    });
    assert.strictEqual(regRes.status, 201);

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;

    // 2. Notification Preferences & Dispatch (Module 13)
    console.log('Testing notification preferences update...');
    const prefRes = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emailEnabled: true, inAppEnabled: true })
    });
    assert.strictEqual(prefRes.status, 200);

    // Verify preferences persist
    const getPrefRes = await fetch(`${API_BASE}/notifications/preferences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getPrefData = await getPrefRes.json();
    assert.strictEqual(getPrefData.preferences.email_enabled, 1);
    assert.strictEqual(getPrefData.preferences.in_app_enabled, 1);

    // 3. Reports & Analytics Aggregations (Module 14)
    console.log('Testing analytical report endpoints...');
    const rpts = ['attendance', 'leave', 'payroll', 'recruitment', 'performance', 'projects', 'assets', 'helpdesk'];
    for (const r of rpts) {
      const res = await fetch(`${API_BASE}/reports/${r}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 200, `Report ${r} should return 200`);
      const data = await res.json();
      console.log(`Report [${r}] loaded metadata.`);
    }

    // 4. AI persistent conversations & RAG tooluse (Module 15)
    console.log('Testing AI Assistant persistent query...');
    const aiRes = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query: 'Show all policy documents', activeTab: 'documents' })
    });
    assert.strictEqual(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.ok(aiData.response.includes('AI Operations Assistant'));
    assert.ok(aiData.conversationId > 0);
    convId = aiData.conversationId;

    // Verify conversation listed in history
    console.log('Verifying AI conversation history...');
    const convsRes = await fetch(`${API_BASE}/ai/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const convsData = await convsRes.json();
    assert.ok(convsData.conversations.some(c => c.id === convId));

    // Verify messages list
    const msgsRes = await fetch(`${API_BASE}/ai/conversations/${convId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const msgsData = await msgsRes.json();
    assert.strictEqual(msgsData.messages.length, 2, 'Should contain user message and assistant reply');

    console.log('--- ALL DAY 8 INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
