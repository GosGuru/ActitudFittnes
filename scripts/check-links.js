const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue; // skip node_modules
      files = files.concat(getHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function checkLinks(file, repoRoot) {
  const content = fs.readFileSync(file, 'utf8');
  const linkRegex = /<a\s+[^>]*?href=["']([^"']+)["'][^>]*>/gi;
  let match;
  let errors = [];
  while ((match = linkRegex.exec(content))) {
    const href = match[1];
    if (/^(#|https?:\/\/|mailto:|tel:|javascript:)/i.test(href)) {
      continue;
    }
    let target = href.split('#')[0].split('?')[0];
    if (!target) continue;
    const targetPath = path.resolve(
      path.isAbsolute(target) ? repoRoot : path.dirname(file),
      target
    );
    if (!fs.existsSync(targetPath)) {
      errors.push({ file, href });
    }
  }
  return errors;
}

function main() {
  const repoRoot = process.cwd();
  const htmlFiles = getHtmlFiles(repoRoot);
  let broken = [];
  for (const file of htmlFiles) {
    broken = broken.concat(checkLinks(file, repoRoot));
  }
  if (broken.length > 0) {
    console.error('Broken links found:');
    for (const b of broken) {
      console.error(`  ${b.file}: ${b.href}`);
    }
    console.error(`${broken.length} broken link(s) found.`);
    process.exit(1);
  } else {
    console.log('All internal links are valid.');
  }
}

main();
