import { connectDB, client } from '../config/db.js';

async function testDBConnection() {
  try {
    const db = await connectDB();
    console.log('✅ MongoDB Connected for Testing');

    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1); // 🔴 GitHub Actions will FAIL here
  } finally {
    await client.close();
    console.log('⚠️ MongoDB Connection Closed (Test Cleanup)');
  }
}

testDBConnection();
