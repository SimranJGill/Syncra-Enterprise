import fs from 'fs';
import path from 'path';

// Set test port and environment
process.env.PORT = 5001;
process.env.JWT_SECRET = 'TEST_JWT_SECRET_KEY';

console.log('--- STARTING ARCHITECTURE AUTHENTICATION TESTS ---');

// Remove existing database if any, to start fresh
const dbPath = path.resolve(import.meta.dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('Cleared existing test database.');
  } catch (err) {
    console.warn('Could not delete database.sqlite, continuing...');
  }
}

// Import server
await import('./src/server.js');

// Helper to make HTTP JSON requests using native fetch
async function makeRequest(url, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}

setTimeout(async () => {
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message, actual = null) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}${actual !== null ? ` (Actual: ${actual})` : ''}`);
    }
  }

  try {
    const baseUrl = 'http://localhost:5001/api/v1/auth';

    // Test 1: Health Status Check
    const statusRes = await makeRequest('http://localhost:5001/api/v1/health');
    assert(statusRes.status === 200 && statusRes.data.status === 'ok', 'API V1 Health endpoint is healthy');

    // Test 2: Invalid Registration (Missing Fields)
    const badReg = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Test User'
    });
    assert(badReg.status === 400, 'Registration fails with 400 when fields are missing');

    // Test 3: Admin Registration without Access Code
    const adminNoCode = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Manager User',
      email: 'manager@company.com',
      password: 'password123',
      role: 'Admin',
      organization: 'Test Org'
    });
    assert(adminNoCode.status === 403, 'Admin registration fails with 403 when access code is missing');

    // Test 4: Admin Registration with Wrong Access Code
    const adminBadCode = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Manager User',
      email: 'manager@company.com',
      password: 'password123',
      role: 'Admin',
      organization: 'Test Org',
      accessCode: 'WRONG_CODE'
    });
    assert(adminBadCode.status === 403, 'Admin registration fails with 403 with invalid access code');

    // Test 5: Successful Employee Registration
    const empReg = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Employee User',
      email: 'employee@company.com',
      password: 'password123',
      role: 'Employee',
      organization: 'Test Org'
    });
    assert(empReg.status === 214, 'Employee registration succeeds with status 214', empReg.status);

    // Test 6: Successful Admin Registration
    const adminReg = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Manager User',
      email: 'manager@company.com',
      password: 'password123',
      role: 'Admin',
      organization: 'Test Org',
      accessCode: 'ADMIN2026'
    });
    assert(adminReg.status === 214, 'Admin registration succeeds with 214 using valid code', adminReg.status);

    // Test 7: Duplicate Email Registration
    const dupReg = await makeRequest(`${baseUrl}/register`, 'POST', {
      name: 'Another User',
      email: 'employee@company.com',
      password: 'password123',
      role: 'Employee',
      organization: 'Test Org'
    });
    assert(dupReg.status === 409, 'Duplicate registration fails with 409 Conflict');

    // Test 8: Login with Incorrect Password
    const badLogin = await makeRequest(`${baseUrl}/login`, 'POST', {
      email: 'employee@company.com',
      password: 'wrongpassword'
    });
    assert(badLogin.status === 401, 'Login fails with 401 for incorrect password');

    // Test 9: Login Successful
    const goodLogin = await makeRequest(`${baseUrl}/login`, 'POST', {
      email: 'employee@company.com',
      password: 'password123'
    });
    assert(goodLogin.status === 200 && goodLogin.data.token !== undefined, 'Login succeeds with 200 and returns JWT');
    const token = goodLogin.data.token;

    // Test 10: Fetch Profile with JWT (Get /me)
    const meRes = await makeRequest(`${baseUrl}/me`, 'GET', null, token);
    assert(
      meRes.status === 200 && 
      meRes.data.user.email === 'employee@company.com' && 
      meRes.data.user.role === 'Employee', 
      'Profile endpoint successfully authenticates JWT token and returns correct payload details'
    );

    // Summary
    console.log(`\nVerification Summary: ${passedTests}/${totalTests} tests passed.`);
    if (passedTests === totalTests) {
      console.log('VERIFICATION COMPLETED SUCCESSFULLY! All checks passed.');
      process.exit(0);
    } else {
      console.error('VERIFICATION FAILED! Some checks failed.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}, 1000);
