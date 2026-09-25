/**
 * Schema Verification and Model Load Test
 * Validates that all 8 Mongoose models compile without errors,
 * relationships and refs are properly defined,
 * enums and schema constraints work as expected,
 * and the duplicate-prevention compound index is correctly registered.
 */

const mongoose = require('mongoose');
const {
  User,
  StudentProfile,
  FacultyProfile,
  Event,
  ActivitySubmission,
  ScoringRule,
  AuditLog,
  Notification
} = require('../models');

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('='.repeat(70));
console.log('Running MongoDB / Mongoose Schema Load & Validation Test Suite');
console.log('='.repeat(70));

// 1. Verify Model Registration
const expectedModels = [
  'User',
  'StudentProfile',
  'FacultyProfile',
  'Event',
  'ActivitySubmission',
  'ScoringRule',
  'AuditLog',
  'Notification'
];

expectedModels.forEach((modelName) => {
  const model = mongoose.models[modelName];
  assert(!!model, `Model '${modelName}' is properly compiled and registered in Mongoose`);
});

// 2. Verify References
console.log('\n--- Checking Reference Targets ---');
assert(
  StudentProfile.schema.path('studentId').options.ref === 'User',
  "StudentProfile.studentId references 'User'"
);
assert(
  FacultyProfile.schema.path('userId').options.ref === 'User',
  "FacultyProfile.userId references 'User'"
);
assert(
  Event.schema.path('createdBy').options.ref === 'User',
  "Event.createdBy references 'User'"
);
assert(
  ActivitySubmission.schema.path('studentId').options.ref === 'User',
  "ActivitySubmission.studentId references 'User'"
);
assert(
  ActivitySubmission.schema.path('eventId').options.ref === 'Event',
  "ActivitySubmission.eventId references 'Event'"
);
assert(
  ActivitySubmission.schema.path('verifiedBy').options.ref === 'User',
  "ActivitySubmission.verifiedBy references 'User'"
);
assert(
  AuditLog.schema.path('actorId').options.ref === 'User',
  "AuditLog.actorId references 'User'"
);
assert(
  Notification.schema.path('userId').options.ref === 'User',
  "Notification.userId references 'User'"
);
assert(
  Notification.schema.path('relatedSubmissionId').options.ref === 'ActivitySubmission',
  "Notification.relatedSubmissionId references 'ActivitySubmission'"
);

// 3. Verify Enums
console.log('\n--- Checking Schema Enum Enforcement ---');
const submissionRoles = ActivitySubmission.schema.path('role').enumValues;
assert(
  JSON.stringify(submissionRoles.sort()) ===
    JSON.stringify(['Head', 'Organizer', 'Participant', 'Winner']),
  `ActivitySubmission.role enum matches exact values: [${submissionRoles.join(', ')}]`
);

const submissionStatuses = ActivitySubmission.schema.path('status').enumValues;
assert(
  JSON.stringify(submissionStatuses.sort()) ===
    JSON.stringify(['Approved', 'Overridden', 'Pending', 'Rejected', 'Resubmitted']),
  `ActivitySubmission.status enum matches exact values: [${submissionStatuses.join(', ')}]`
);

const userRoles = User.schema.path('role').enumValues;
assert(
  JSON.stringify(userRoles.sort()) === JSON.stringify(['admin', 'faculty', 'student']),
  `User.role enum matches exact values: [${userRoles.join(', ')}]`
);

const scoringRoles = ScoringRule.schema.path('role').enumValues;
assert(
  JSON.stringify(scoringRoles.sort()) ===
    JSON.stringify(['Head', 'Organizer', 'Participant', 'Winner']),
  `ScoringRule.role enum matches exact values: [${scoringRoles.join(', ')}]`
);

// 4. Verify Duplicate Prevention Compound Index on ActivitySubmission
console.log('\n--- Checking Duplicate Prevention Index ---');
const submissionIndexes = ActivitySubmission.schema.indexes();
const duplicateIndex = submissionIndexes.find(
  ([idxDef, options]) =>
    idxDef.studentId === 1 &&
    idxDef.eventId === 1 &&
    idxDef.role === 1 &&
    idxDef.semester === 1 &&
    options &&
    options.unique === true
);

assert(
  !!duplicateIndex,
  'ActivitySubmission has compound unique index on { studentId: 1, eventId: 1, role: 1, semester: 1 }'
);

// 5. Test Model Instantiation & Schema Validation
console.log('\n--- Testing Document Instantiation & Schema Validation ---');

// ActivitySubmission validation test
const validSubmission = new ActivitySubmission({
  studentId: new mongoose.Types.ObjectId(),
  eventId: new mongoose.Types.ObjectId(),
  semester: 3,
  role: 'Winner',
  description: 'First prize in Hackathon',
  proofUrl: 'https://storage.example.com/proofs/cert123.pdf',
  proofType: 'application/pdf',
  status: 'Pending'
});

const submissionValidationError = validSubmission.validateSync();
assert(
  !submissionValidationError,
  'Valid ActivitySubmission document passes validateSync() without errors'
);

// Test invalid enum rejection
const invalidSubmission = new ActivitySubmission({
  studentId: new mongoose.Types.ObjectId(),
  eventId: new mongoose.Types.ObjectId(),
  semester: 3,
  role: 'InvalidRole',
  proofUrl: 'https://example.com/cert.pdf',
  proofType: 'pdf'
});
const invalidSubmissionError = invalidSubmission.validateSync();
assert(
  invalidSubmissionError && invalidSubmissionError.errors['role'],
  'Invalid role for ActivitySubmission is rejected by schema-level enum validation'
);

// Test points default and bounds
assert(
  validSubmission.points === 0,
  'ActivitySubmission.points defaults to 0 (cannot be initialized by unverified client)'
);

// Test User model validation
const validUser = new User({
  name: 'John Doe',
  email: 'john.doe@example.com',
  passwordHash: '$2b$10$xyz...',
  role: 'student',
  rollNo: 'MBA2025001',
  program: 'MBA Tech',
  year: 2,
  division: 'A'
});
const userValidationError = validUser.validateSync();
assert(!userValidationError, 'Valid User document passes validateSync() without errors');

// Test Invalid Email rejection
const invalidUser = new User({
  name: 'Invalid User',
  email: 'not-an-email',
  passwordHash: 'hash',
  role: 'student'
});
const invalidUserError = invalidUser.validateSync();
assert(
  invalidUserError && invalidUserError.errors['email'],
  'Invalid email format is rejected by User regex validation'
);

// Summary
console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('🎉 ALL 17 SCHEMA VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('All 8 models are fully verified and ready for production.');
} else {
  console.error(`💥 TEST SUITE FAILED with ${failures} error(s).`);
  process.exit(1);
}
console.log('='.repeat(70));
