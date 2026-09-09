#!/usr/bin/env node
/**
 * 为 standard-examples.json 中的每条示例生成 expected 解析结果
 *
 * 用法：node scripts/generate-expected.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '../dist/index.cjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const FIXTURES_PATH = resolve(root, 'src/__tests__/__fixtures__/standard-examples.json');

function extractExpected(input) {
  try {
    const result = parse(input);
    const r = result.reference;
    const expected = { type: r.type };
    if (r.year) expected.year = r.year;
    if (r.volume) expected.volume = r.volume;
    if (r.issue) expected.issue = r.issue;
    if (r.pages) expected.pages = r.pages;
    if (r.journalTitle) expected.journalTitle = r.journalTitle;
    if (r.publisherPlace) expected.publisherPlace = r.publisherPlace;
    if (r.publisher) expected.publisher = r.publisher;
    if (r.awardPlace) expected.awardPlace = r.awardPlace;
    if (r.awardInstitution) expected.awardInstitution = r.awardInstitution;
    if (r.title) expected.title = r.title;
    if (r.authors?.length > 0) expected.authors = r.authors.map(a => a.name);
    return { success: true, expected };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function main() {
  const data = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'));
  let updated = 0;
  let errors = 0;

  data.groups = data.groups.map(group => ({
    ...group,
    examples: group.examples.map(ex => {
      if (!ex.content || ex.skip) return ex;
      const input = `[1] ${ex.content}`;
      const result = extractExpected(input);
      if (result.success) {
        updated++;
        return { ...ex, expected: result.expected };
      } else {
        errors++;
        return { ...ex, expected: { _error: result.error }, skip: true, skipReason: `parse error: ${result.error}` };
      }
    }),
  }));

  writeFileSync(FIXTURES_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${updated} examples, ${errors} errors`);
  console.log(`Output: ${FIXTURES_PATH}`);
}

main();
