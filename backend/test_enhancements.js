import assert from 'assert';

const API_BASE = 'http://localhost:5000/api/v1';
let token = '';
let adminId = null;

async function runTests() {
  console.log('--- STARTING P0 DIFFERENTIATORS INTEGRATION TESTS ---');

  try {
    // 1. Setup & Authenticate Admin
    const email = `admin_enh_${Date.now()}@wfm.com`;
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

    // 2. Test Agent Queue (ENH-01)
    console.log('Triggering burnout check to propose agent action...');
    const trigRes = await fetch(`${API_BASE}/agents/trigger-burnout-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ employeeId: 2 })
    });
    assert.strictEqual(trigRes.status, 200);

    // List pending actions
    const pendingRes = await fetch(`${API_BASE}/agents/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pendingData = await pendingRes.json();
    assert.ok(pendingData.actions.length > 0);
    const actionId = pendingData.actions[0].id;
    console.log(`Actionproposed in queue with ID: ${actionId}`);

    // Approve action
    const approveRes = await fetch(`${API_BASE}/agents/${actionId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(approveRes.status, 200);

    // Verify status updated to executed
    const logsRes = await fetch(`${API_BASE}/agents/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const logsData = await logsRes.json();
    assert.ok(logsData.logs.some(l => l.id === actionId && l.status === 'executed'));
    console.log('Agent action executed and logged in audit trail.');

    // 3. Test Skills & Talent Marketplace (ENH-02)
    console.log('Adding skill tag to employee...');
    const addSkillRes = await fetch(`${API_BASE}/skills/employee/2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ skillName: 'React.js', category: 'Frontend', proficiency: 4 })
    });
    assert.strictEqual(addSkillRes.status, 200);

    // Get tagged skills
    const getSkillRes = await fetch(`${API_BASE}/skills/employee/2`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getSkillData = await getSkillRes.json();
    assert.ok(getSkillData.employeeSkills.some(s => s.skill_name === 'React.js' && s.proficiency === 4));

    // Post internal gig
    console.log('Posting internal micro-gig...');
    const gigRes = await fetch(`${API_BASE}/skills/gigs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Vite Migration micro-gig',
        description: 'Migrate legacy layouts to Vite workspace',
        requiredSkills: [{ skillName: 'React.js', minProficiency: 3 }],
        estimatedHours: 20,
        postedBy: 2,
        departmentId: 1
      })
    });
    assert.strictEqual(gigRes.status, 201);

    // Get open gigs
    const getGigsRes = await fetch(`${API_BASE}/skills/gigs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getGigsData = await getGigsRes.json();
    assert.ok(getGigsData.gigs.some(g => g.title === 'Vite Migration micro-gig'));
    const gigId = getGigsData.gigs[0].id;

    // Bid on gig
    console.log('Bidding on internal gig...');
    const bidRes = await fetch(`${API_BASE}/skills/gigs/${gigId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ employeeId: 2, proposedHours: 15, message: 'I have strong react experience.' })
    });
    assert.strictEqual(bidRes.status, 200);

    // 4. Test Predictive What-If Simulator (ENH-03)
    console.log('Running what-if resignation ripple simulation...');
    const simRes = await fetch(`${API_BASE}/analytics/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ scenarioType: 'resignation', variables: { employeeName: 'Senior Bob' } })
    });
    assert.strictEqual(simRes.status, 200);
    const simData = await simRes.json();
    assert.ok(simData.projectedOutcomes.skillLoss.includes('gaps detected'));

    // 5. Test Hybrid Work Capacity (ENH-05)
    console.log('Booking office floor desk coordinates...');
    const bookingRes = await fetch(`${API_BASE}/hybrid/desk-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ employeeId: 2, deskId: 'Desk 1', date: '2026-07-10', floorId: 1 })
    });
    assert.strictEqual(bookingRes.status, 200);

    // 6. Test Gamification (ENH-08)
    console.log('Fetching gamification XP profile...');
    const profileRes = await fetch(`${API_BASE}/gamification/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (profileRes.status !== 200) {
      const errTxt = await profileRes.text();
      assert.strictEqual(profileRes.status, 200, `Profile load failed: ${errTxt}`);
    }
    const profileData = await profileRes.json();
    assert.strictEqual(profileData.profile.level, 1);

    // 7. Org scenario reorg planner (ENH-10)
    console.log('Saving org reorg scenario sandbox...');
    const scenRes = await fetch(`${API_BASE}/org-chart/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        scenarioName: 'Q3 IT Restructure Plan',
        changes: [{ employeeId: 2, toManagerId: 1 }],
        projectedImpact: { costImpact: '+$1200/month', nodeMoves: 1 }
      })
    });
    assert.strictEqual(scenRes.status, 201);

    console.log('--- ALL DIFFERENTIATOR INTEGRATION TESTS PASSED ---');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
