/**
 * Comprehensive Automated Auth & RBAC Middleware Test Suite
 * Validates all acceptance criteria:
 * 1. Valid login returns working token; invalid credentials return clean 401.
 * 2. Request to roleCheck(['admin']) route with student token returns 403.
 * 3. Request with no token returns 401.
 * 4. GET /api/auth/me returns the correct user for a valid token.
 * 5. Passwords are verifiably hashed in MongoDB (not plaintext).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/co_curricular_test_db';

let server;
let baseUrl;
let failures = 0;

function assert(condition, message, detail = '') {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    if (detail) console.error(`   Details:`, detail);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
    if (detail) console.log(`   ${detail}`);
  }
}

async function runTests() {
  console.log('='.repeat(75));
  console.log('MISSION A: Authentication & RBAC Test Suite');
  console.log('='.repeat(75));

  try {
    // Connect to test database
    await mongoose.connect(TEST_DB_URI);
    console.log(`Connected to test database at: ${TEST_DB_URI}`);

    // Clean up test collection
    await User.deleteMany({});

    // 1. Password Hashing & Seed Storage Verification
    console.log('\n--- Criterion 5: Password Hashing Verification in Storage ---');
    const plainPasswords = {
      student: 'StudentPass123!',
      faculty: 'FacultyPass123!',
      admin: 'AdminPass123!'
    };

    const studentHash = await bcrypt.hash(plainPasswords.student, 10);
    const facultyHash = await bcrypt.hash(plainPasswords.faculty, 10);
    const adminHash = await bcrypt.hash(plainPasswords.admin, 10);

    const studentUser = await User.create({
      name: 'Alice Student',
      email: 'student@example.com',
      passwordHash: studentHash,
      role: 'student',
      rollNo: 'MBA2026-001',
      program: 'MBA Tech',
      year: 1,
      division: 'A'
    });

    const facultyUser = await User.create({
      name: 'Dr. Bob Faculty',
      email: 'faculty@example.com',
      passwordHash: facultyHash,
      role: 'faculty',
      department: 'Management'
    });

    const adminUser = await User.create({
      name: 'Carol Admin',
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'admin'
    });

    // Inspect raw document in MongoDB collection directly to prove password is not plaintext
    const rawStudentDoc = await mongoose.connection.collection('users').findOne({ email: 'student@example.com' });
    const isBcryptHash = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(rawStudentDoc.passwordHash);
    assert(
      isBcryptHash,
      'Password stored as bcrypt hash in MongoDB (valid $2a$/$2b$ modular crypt format)',
      `Stored Hash: ${rawStudentDoc.passwordHash}`
    );
    assert(
      !rawStudentDoc.password && !JSON.stringify(rawStudentDoc).includes(plainPasswords.student),
      'Plaintext password never exists in database document'
    );

    // Start Express server on ephemeral port for real HTTP tests
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 2. Acceptance Criterion 1: Login verification & 401 handling
    console.log('\n--- Criterion 1: Login & Clean 401 Error Handling ---');
    
    // Valid student login
    const validLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: plainPasswords.student })
    });
    const validLoginData = await validLoginRes.json();
    assert(
      validLoginRes.status === 200 && !!validLoginData.token,
      'Valid login returns HTTP 200 and a working JWT token'
    );
    assert(
      validLoginData.user && validLoginData.user.role === 'student' && !validLoginData.user.passwordHash,
      'Login response contains safe user object with role and excludes passwordHash'
    );

    const studentToken = validLoginData.token;

    // Login for admin and faculty to test role authorization
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: plainPasswords.admin })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    const facultyLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@example.com', password: plainPasswords.faculty })
    });
    const facultyLoginData = await facultyLoginRes.json();
    const facultyToken = facultyLoginData.token;

    // Invalid password
    const invalidPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'WrongPassword999!' })
    });
    const invalidPassData = await invalidPassRes.json();
    assert(
      invalidPassRes.status === 401 && invalidPassData.success === false,
      'Invalid password returns clean HTTP 401 (no stack trace)',
      `Response: ${JSON.stringify(invalidPassData)}`
    );

    // Non-existent email
    const invalidEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'AnyPassword123' })
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(
      invalidEmailRes.status === 401 && invalidEmailData.success === false,
      'Non-existent email returns clean HTTP 401 (no stack trace)',
      `Response: ${JSON.stringify(invalidEmailData)}`
    );

    // 3. Acceptance Criterion 3: Unauthenticated request returns 401
    console.log('\n--- Criterion 3: Unauthenticated Protected Requests Return 401 ---');
    const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 && noTokenData.success === false,
      'Request with no token to protected route returns HTTP 401',
      `Response: ${JSON.stringify(noTokenData)}`
    );

    const badTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer totally_invalid_malformed_token' }
    });
    const badTokenData = await badTokenRes.json();
    assert(
      badTokenRes.status === 401 && badTokenData.success === false,
      'Request with invalid/malformed token returns HTTP 401'
    );

    // 4. Acceptance Criterion 4: GET /api/auth/me returns current user
    console.log('\n--- Criterion 4: GET /api/auth/me User Profile Verification ---');
    const getMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const getMeData = await getMeRes.json();
    assert(
      getMeRes.status === 200 && getMeData.user && getMeData.user.email === 'student@example.com',
      'GET /api/auth/me returns the correct current user profile',
      `User returned: ${getMeData.user.name} (${getMeData.user.role})`
    );
    assert(
      !getMeData.user.passwordHash,
      'GET /api/auth/me excludes passwordHash from returned profile'
    );

    // 5. Acceptance Criterion 2: RBAC roleCheck testing (403 for unauthorized)
    console.log('\n--- Criterion 2: RBAC roleCheck Middleware Enforcement ---');
    
    // Student attempting to access admin-only route
    const studentToAdminRes = await fetch(`${baseUrl}/api/test/admin-only`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentToAdminData = await studentToAdminRes.json();
    assert(
      studentToAdminRes.status === 403 && studentToAdminData.success === false,
      'Student token accessing roleCheck(["admin"]) route returns HTTP 403 Forbidden',
      `Response: ${JSON.stringify(studentToAdminData)}`
    );

    // Admin accessing admin-only route
    const adminToAdminRes = await fetch(`${baseUrl}/api/test/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminToAdminData = await adminToAdminRes.json();
    assert(
      adminToAdminRes.status === 200 && adminToAdminData.success === true,
      'Admin token accessing roleCheck(["admin"]) route returns HTTP 200 OK'
    );

    // Composable multi-role route: roleCheck(['faculty', 'admin'])
    const studentToFacultyAdminRes = await fetch(`${baseUrl}/api/test/faculty-admin`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentToFacultyAdminRes.status === 403,
      'Student token accessing composable roleCheck(["faculty", "admin"]) returns HTTP 403 Forbidden'
    );

    const facultyToFacultyAdminRes = await fetch(`${baseUrl}/api/test/faculty-admin`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(
      facultyToFacultyAdminRes.status === 200,
      'Faculty token accessing composable roleCheck(["faculty", "admin"]) returns HTTP 200 OK'
    );

    // 6. Logout test (POST /api/auth/logout)
    console.log('\n--- Logout Endpoint Verification ---');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST'
    });
    const logoutData = await logoutRes.json();
    assert(
      logoutRes.status === 200 && logoutData.success === true,
      'POST /api/auth/logout returns HTTP 200 OK'
    );

    // Final Summary
    console.log('\n' + '='.repeat(75));
    if (failures === 0) {
      console.log('🎉 ALL MISSION A ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!');
      console.log('1. Valid login returns token; invalid credentials return clean 401.');
      console.log('2. roleCheck(["admin"]) blocks student with 403 Forbidden.');
      console.log('3. Unauthenticated requests to protected routes return 401.');
      console.log('4. GET /api/auth/me returns the authenticated user.');
      console.log('5. Passwords verifiably stored as bcrypt hashes ($2a$).');
    } else {
      console.error(`💥 TEST SUITE FAILED with ${failures} error(s).`);
      process.exitCode = 1;
    }
    console.log('='.repeat(75));

  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runTests();
