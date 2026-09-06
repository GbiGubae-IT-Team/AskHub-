import prisma from './src/config/db.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map((u: any) => ({
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    staffStatus: u.staffStatus,
    id: u.id
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
