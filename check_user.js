const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ov_salt_2024');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + '_' + Buffer.from(password + 'ov_salt_2024').toString('base64');
}

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'umangptl11@gmail.com' },
    select: { id: true, email: true, password: true, role: true }
  });
  console.log('User found:', JSON.stringify(user, null, 2));
  
  if (user) {
    const hash12345678 = hashPassword('12345678');
    console.log('\nHash of "12345678":', hash12345678);
    console.log('Stored password:   ', user.password);
    console.log('Match:', hash12345678 === user.password);
    
    // Update password to '12345678' so merchant can log in
    if (hash12345678 !== user.password) {
      console.log('\nUpdating password to "12345678"...');
      await db.user.update({
        where: { email: 'umangptl11@gmail.com' },
        data: { password: hash12345678 }
      });
      console.log('Password updated! Now try logging in with: umangptl11@gmail.com / 12345678');
    }
  }
  
  await db.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
