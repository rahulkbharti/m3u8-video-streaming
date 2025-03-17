import { connectDB , client} from '../config/db.js';

async function testDBConnection() {
  try {
    const db = await connectDB();
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    console.log('⚠️ MongoDB Connection Closed (Test Cleanup)');
  }
}

testDBConnection();
