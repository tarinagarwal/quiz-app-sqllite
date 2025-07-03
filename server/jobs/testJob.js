import { runJob } from "./scheduler.js";

const jobName = process.argv[2];

if (!jobName) {
  console.log("❌ Please specify a job name");
  console.log("Available jobs:");
  console.log("  - daily-reminder");
  console.log("  - weekly-report");
  console.log("  - admin-daily-report");
  console.log("  - collect-metrics");
  console.log("  - database-cleanup");
  console.log("");
  console.log("Usage: npm run test-job <job-name>");
  console.log("Example: npm run test-job daily-reminder");
  process.exit(1);
}

console.log(`🚀 Running job: ${jobName}`);
console.log("⏳ Please wait...\n");

try {
  await runJob(jobName);
  console.log(`\n✅ Job '${jobName}' completed successfully!`);
} catch (error) {
  console.error(`\n❌ Job '${jobName}' failed:`, error.message);
  process.exit(1);
}
