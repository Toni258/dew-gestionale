// Small test helper for generate hash.
import bcrypt from 'bcrypt';

// Helper function used by run.
async function run() {
    const hash = await bcrypt.hash('Admin123!', 10);
    console.log('Hash generato:');
    console.log(hash);
}

run();