import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error("Usage: ts-node src/scripts/deleteCompany.ts <contactEmail>");
  process.exit(1);
}

async function main() {
  try {
    const company = await prisma.company.findFirst({
      where: { contactEmail: email },
    });

    if (!company) {
      console.error("Company not found for email:", email);
      return;
    }

    await prisma.company.delete({
      where: { id: company.id },
    });

    console.log(`Deleted company ${company.name} (${company.id})`);
  } catch (error: any) {
    if (error.code === "P2025") {
      console.error("Company not found for email:", email);
    } else {
      console.error("Failed to delete company:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
