import assert from 'assert';

const API_BASE = 'http://localhost:5000/api/v1';
let adminToken = '';
let employeeToken = '';
let projectId = null;
let taskId = null;
let assetId = null;
let ticketId = null;
let documentId = null;

async function runTests() {
  console.log('--- STARTING MODULE 9-12 BUSINESS RULES INTEGRATION TESTS ---');

  try {
    // 1. Setup Admin & Employee accounts
    const adminEmail = `admin_m9_${Date.now()}@wfm.com`;
    const employeeEmail = `emp_m9_${Date.now()}@wfm.com`;

    console.log('1. Registering and authenticating Test Admin...');
    const regAdminRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Project PM',
        email: adminEmail,
        password: 'Password123!',
        role: 'Admin',
        organization: 'MC',
        accessCode: 'ADMIN2026'
      })
    });
    assert.strictEqual(regAdminRes.status, 201);

    const loginAdminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'Password123!' })
    });
    const loginAdminData = await loginAdminRes.json();
    adminToken = loginAdminData.token;

    // Register test employee
    console.log('Registering test employee Bob...');
    await fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'R&D Dept', code: 'RND', parentId: null, managerId: null })
    });
    await fetch(`${API_BASE}/designations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'R&D Lead', departmentId: 1, level: 'lead' })
    });
    
    const onboardEmpRes = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Bob Builder',
        email: employeeEmail,
        mobile: '+15552999',
        address: '789 Oak Rd',
        gender: 'Male',
        bloodGroup: 'B+',
        dob: '1990-05-15',
        departmentId: 1,
        designationId: 1,
        joiningDate: '2026-02-01',
        reportingManagerId: null,
        employmentType: 'Full-time',
        salaryGrade: 'G4',
        salary: '110000'
      })
    });
    assert.strictEqual(onboardEmpRes.status, 201);
    const onboardEmpData = await onboardEmpRes.json();
    const bobEmployeeId = onboardEmpData.employee.id;

    // Reset password so Bob can log in
    await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: employeeEmail, newPassword: 'Password123!' })
    });

    const loginEmpRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: employeeEmail, password: 'Password123!' })
    });
    const loginEmpData = await loginEmpRes.json();
    employeeToken = loginEmpData.token;

    // 2. Project & Tasks Constraints (Module 9.1 & 9.2)
    console.log('2. Testing Projects & Tasks Creation...');
    const projRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Workforce OS V2',
        description: 'Building Modules 9-12',
        ownerId: bobEmployeeId,
        startDate: '2026-07-08',
        endDate: '2026-09-01',
        members: [bobEmployeeId]
      })
    });
    const projData = await projRes.json();
    assert.strictEqual(projRes.status, 201);
    projectId = projData.projectId;

    const taskRes = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Draft SQLite Schema',
        description: 'Define projects, tasks, assets tables',
        assigneeId: bobEmployeeId,
        priority: 'High',
        deadline: '2026-07-15'
      })
    });
    const taskData = await taskRes.json();
    assert.strictEqual(taskRes.status, 201);
    taskId = taskData.taskId;

    // Rule: cannot move task to Completed directly from To Do (requires Review stage)
    console.log('Verifying Review-before-Completion constraint...');
    const badStatusRes = await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert.strictEqual(badStatusRes.status, 400, 'Direct completion from To Do should be blocked');

    // Move task to Review
    await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Review' })
    });

    // Move task to Completed (now allowed)
    const okStatusRes = await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert.strictEqual(okStatusRes.status, 200, 'Should allow completion from Review stage');

    // Rule: completed tasks are read-only
    console.log('Verifying Completed task read-only constraint...');
    const editCompletedRes = await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ priority: 'Low' })
    });
    assert.strictEqual(editCompletedRes.status, 400, 'Modifying completed task should be blocked');

    // 3. Asset Assignments Registry (Module 10)
    console.log('3. Testing Assets Registry Assignment & Return...');
    const assetRes = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Developer Laptop X1',
        type: 'Laptop',
        assetTag: 'AST-0099',
        serialNumber: 'SN-X1-999',
        purchaseDate: '2026-01-10',
        purchaseCost: 1500,
        warrantyExpiry: '2029-01-10'
      })
    });
    const assetData = await assetRes.json();
    assert.strictEqual(assetRes.status, 201);
    assetId = assetData.assetId;

    // Checkout to Bob
    const assignRes = await fetch(`${API_BASE}/assets/${assetId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ employeeId: bobEmployeeId })
    });
     const assignData = await assignRes.json();
     console.log('assignRes status:', assignRes.status, 'body:', assignData);
     assert.strictEqual(assignRes.status, 200);

     // Verify Bob sees it in self-service my-assets
     const myAssetsRes = await fetch(`${API_BASE}/assets/my`, {
       headers: { 'Authorization': `Bearer ${employeeToken}` }
     });
     const myAssetsData = await myAssetsRes.json();
     console.log('myAssetsData:', myAssetsData);
     assert.ok(myAssetsData.assets.some(a => a.asset_tag === 'AST-0099'));

    // 4. Help Desk Ticket Auto-Routing (Module 11)
    console.log('4. Testing Help Desk Category Auto-Routing...');
    // Bob files ticket for Category "Asset issue" -> should auto-link AST-0099
    const ticketRes = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${employeeToken}` },
      body: JSON.stringify({
        category: 'Asset issue',
        subject: 'Screen flickering',
        description: 'The laptop screen flickering repeatedly',
        priority: 'High'
      })
    });
    const ticketData = await ticketRes.json();
    assert.strictEqual(ticketRes.status, 201);
    ticketId = ticketData.ticketId;

    // Verify it auto-linked the asset
    const getTicketRes = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const getTicketData = await getTicketRes.json();
    assert.strictEqual(getTicketData.ticket.linked_asset_id, assetId, 'Category Asset issue should auto-link user laptop');

    // 5. Document Access Controls (Module 12)
    console.log('5. Testing Document Repository Access Controls...');
    const docRes = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Finance Audit Handbook',
        category: 'Handbook',
        fileUrl: 'http://docs.wfm.com/finance.pdf',
        visibility: 'role-restricted',
        targetId: 'Super Admin'
      })
    });
    assert.strictEqual(docRes.status, 201);

    // Verify Bob (Employee role) cannot see the Super Admin restricted document
    const listDocsRes = await fetch(`${API_BASE}/documents`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const listDocsData = await listDocsRes.json();
    assert.ok(!listDocsData.documents.some(d => d.title === 'Finance Audit Handbook'), 'Employee should not see role-restricted documents');

    console.log('--- ALL MODULE 9-12 INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
