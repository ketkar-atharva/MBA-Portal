/**
 * Live Atlas Connection and Index Sync Test
 * Run this after adding your MongoDB Atlas URI to .env:
 * node server/tests/testAtlasConnection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const models = require('../models');

async function testAtlasConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.log('\n⚠️  Notice: MongoDB Atlas URI in .env contains placeholder credentials.');
    console.log('To run live database connection tests against Atlas:');
    console.log('1. Open .env');
    console.log('2. Replace <username>, <password>, and cluster domain with your Atlas credentials');
    console.log('3. Run: node server/tests/testAtlasConnection.js\n');
    process.exit(0);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Successfully connected to MongoDB Atlas!');

    console.log('Synchronizing indexes for all 8 models...');
    for (const [name, model] of Object.entries(models)) {
      await model.syncIndexes();
      console.log(`✅ Indexes synchronized for ${name}`);
    }

    console.log('\n🎉 Atlas connection and index verification complete!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testAtlasConnection();
