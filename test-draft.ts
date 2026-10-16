import prisma from "./src/lib/prisma";

async function main() {
  try {
    const authorId = "cmv0kfi9w0003k8u1ms0dvdzj"; // from previous context
    const count = await prisma.submission.count();
    const submissionIdString = `JMAS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    console.log("Creating with authorId:", authorId);
    
    const newSubmission = await prisma.submission.create({
      data: {
        title: "ACM Transactions on Privacy and Security",
        abstract: "sfagegehrehrhfn dsffewrwetj",
        keywords: "Quantum",
        sectionId: null,
        currentStep: 2,
        status: "DRAFT",
        authorId: authorId,
        submissionId: submissionIdString,
      },
    });

    console.log("Success:", newSubmission.id);
  } catch (error) {
    console.error("Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
