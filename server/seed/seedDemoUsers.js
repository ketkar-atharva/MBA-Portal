/**
 * Demo Data Seeder for MongoDB Atlas / Local MongoDB
 * Seeds production-ready demo users (Admin, Faculty, Students),
 * associated StudentProfile & FacultyProfile records, and default ScoringRules.
 *
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User,
  StudentProfile,
  FacultyProfile,
  ScoringRule,
  Event
} = require('../models');

const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

const seedDatabase = async () => {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('🌱 Starting Demo Data Seeder for MongoDB');
  console.log(`Connecting to: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log('='.repeat(70));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Database.\n');

    // 1. Password Hashing
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const defaultPassword = {
      admin: 'Admin@12345',
      faculty: 'Faculty@12345',
      student: 'Student@12345'
    };

    const adminHash = await bcrypt.hash(defaultPassword.admin, saltRounds);
    const facultyHash = await bcrypt.hash(defaultPassword.faculty, saltRounds);
    const studentHash = await bcrypt.hash(defaultPassword.student, saltRounds);

    // 2. Define Demo Users
    const demoUsers = [
      {
        name: 'System Administrator',
        email: 'admin@mbaportal.com',
        passwordHash: adminHash,
        role: 'admin',
        division: 'HQ'
      },
      {
        name: 'Dr. Sarah Jenkins',
        email: 'faculty@mbaportal.com',
        passwordHash: facultyHash,
        role: 'faculty',
        division: 'FAC'
      },
      {
        name: 'Rahul Sharma',
        email: 'student@mbaportal.com',
        passwordHash: studentHash,
        role: 'student',
        rollNo: 'MBA2025-010',
        program: 'MBA Tech',
        year: 2,
        division: 'A'
      },
      {
        name: 'Ananya Patel',
        email: 'ananya@mbaportal.com',
        passwordHash: studentHash,
        role: 'student',
        rollNo: 'MBA2025-011',
        program: 'MBA Core',
        year: 1,
        division: 'B'
      }
    ];

    console.log('Seeding Users...');
    const userRecords = {};

    for (const userData of demoUsers) {
      let user = await User.findOne({ email: userData.email });
      if (user) {
        Object.assign(user, userData);
        await user.save();
        console.log(`  🔄 Updated existing user: ${userData.name} (${userData.email})`);
      } else {
        user = await User.create(userData);
        console.log(`  ➕ Created new user: ${userData.name} (${userData.email})`);
      }
      userRecords[userData.email] = user;
    }

    // 3. Seed Faculty Profile
    console.log('\nSeeding Faculty Profile...');
    const facultyUser = userRecords['faculty@mbaportal.com'];
    await FacultyProfile.findOneAndUpdate(
      { userId: facultyUser._id },
      {
        userId: facultyUser._id,
        employeeId: 'EMP-MGT-2024',
        department: 'Management & Strategy',
        assignedPrograms: ['MBA Tech', 'MBA Core']
      },
      { upsert: true, new: true }
    );
    console.log('  ✅ Faculty profile linked for Dr. Sarah Jenkins');

    // 4. Seed Student Profiles
    console.log('\nSeeding Student Profiles...');
    const student1 = userRecords['student@mbaportal.com'];
    await StudentProfile.findOneAndUpdate(
      { studentId: student1._id },
      {
        studentId: student1._id,
        rollNo: student1.rollNo,
        program: student1.program,
        semester: 3,
        academicYear: '2025-2026',
        totalPoints: 0
      },
      { upsert: true, new: true }
    );
    console.log('  ✅ Student profile linked for Rahul Sharma');

    const student2 = userRecords['ananya@mbaportal.com'];
    await StudentProfile.findOneAndUpdate(
      { studentId: student2._id },
      {
        studentId: student2._id,
        rollNo: student2.rollNo,
        program: student2.program,
        semester: 1,
        academicYear: '2025-2026',
        totalPoints: 0
      },
      { upsert: true, new: true }
    );
    console.log('  ✅ Student profile linked for Ananya Patel');

    // 5. Seed Scoring Rules
    console.log('\nSeeding Default Scoring Rules...');
    const scoringRules = [
      { role: 'Participant', points: 10, description: 'Active event participation' },
      { role: 'Organizer', points: 20, description: 'Event organizing committee member' },
      { role: 'Winner', points: 30, description: '1st, 2nd, or 3rd place podium finish' },
      { role: 'Head', points: 40, description: 'Lead student coordinator / committee head' }
    ];

    for (const rule of scoringRules) {
      await ScoringRule.findOneAndUpdate(
        { role: rule.role },
        { ...rule, active: true },
        { upsert: true, new: true }
      );
      console.log(`  ✅ Scoring rule: ${rule.role} -> ${rule.points} pts`);
    }

    // 6. Seed Sample Event
    console.log('\nSeeding Sample Event...');
    const adminUser = userRecords['admin@mbaportal.com'];
    await Event.findOneAndUpdate(
      { name: 'National MBA Business Conclave 2025' },
      {
        name: 'National MBA Business Conclave 2025',
        category: 'Leadership & Case Study',
        organizer: 'MBA Council & Industry Forum',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        semester: 3,
        academicYear: '2025-2026',
        status: 'Upcoming',
        createdBy: adminUser._id
      },
      { upsert: true, new: true }
    );
    console.log('  ✅ Event "National MBA Business Conclave 2025" seeded');

    // Print Credentials Table
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials for Login Testing:');
    console.log('='.repeat(70));
    console.table([
      {
        Role: 'Admin',
        Name: 'System Administrator',
        Email: 'admin@mbaportal.com',
        Password: defaultPassword.admin
      },
      {
        Role: 'Faculty',
        Name: 'Dr. Sarah Jenkins',
        Email: 'faculty@mbaportal.com',
        Password: defaultPassword.faculty
      },
      {
        Role: 'Student',
        Name: 'Rahul Sharma',
        Email: 'student@mbaportal.com',
        Password: defaultPassword.student
      },
      {
        Role: 'Student',
        Name: 'Ananya Patel',
        Email: 'ananya@mbaportal.com',
        Password: defaultPassword.student
      }
    ]);
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error.message);
    if (error.message.includes('querySrv ENOTFOUND')) {
      console.error('\n⚠️  DNS Error Note: The MongoDB Atlas URI appears to use a placeholder hostname:');
      console.error('   "cluster0.mongodb.net" requires your full cluster shard address from Atlas.');
      console.error('   Example: cluster0.abcde.mongodb.net or similar provided in Atlas "Connect" modal.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase();
