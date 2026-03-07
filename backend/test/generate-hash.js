import bcrypt from 'bcrypt';

async function run() {
    const hash = await bcrypt.hash('Admin123!', 10);
    console.log('Hash generato:');
    console.log(hash);
}

run();
