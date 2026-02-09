const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "dist");
const dest = path.join(__dirname, "..", "docs");

if (!fs.existsSync(src)) {
  console.error("Run 'npm run build' first. The dist folder was not found.");
  process.exit(1);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}
copyDir(src, dest);
console.log("Copied dist -> docs. You can now commit the docs folder and push.");
