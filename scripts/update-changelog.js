import fs from 'fs';
import path from 'path';

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const entryPath = path.join(process.cwd(), 'scratch_changelog_entry.md');
const entry = fs.readFileSync(entryPath, 'utf8');

const lines = changelog.split('\n');
lines.splice(8, 0, entry, '');
fs.writeFileSync(changelogPath, lines.join('\n'));
console.log('Changelog updated');
fs.unlinkSync(entryPath);
