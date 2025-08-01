#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const files = [
  "src/app/api/products/[id]/route.ts",
  "src/app/api/invoices/route.ts",
  "src/app/api/invoices/[id]/route.ts",
];

files.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Replace all occurrences
    content = content.replace(/session\?\.user\?\.id/g, "session?.user?.email");
    content = content.replace(/session\.user\.id/g, "session.user.email");

    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
});

console.log(
  "All API routes have been updated to use session.user.email instead of session.user.id"
);
