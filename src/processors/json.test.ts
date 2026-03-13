import {promises as fs} from 'fs';
import * as os from 'os';
import * as path from 'path';
import {leafify, processJsonSpaceUsage} from './json';

async function withTempJson(content: string): Promise<[string, number][]> {
  const file = path.join(os.tmpdir(), `json-test-${Date.now()}.json`);
  await fs.writeFile(file, content, 'utf-8');
  try {
    return await processJsonSpaceUsage([file]);
  } finally {
    await fs.unlink(file);
  }
}

describe('leafify', () => {
  it('leaves entries without children unchanged', () => {
    const counts = {a: 10, b: 20};
    const result = leafify(counts);
    expect(result).toEqual({a: 10, b: 20});
  });

  it('subtracts child sizes from parent', () => {
    const counts = {'a': 100, 'a/b': 40, 'a/c': 30};
    const result = leafify(counts);
    expect(result['a']).toBe(30); // 100 - 40 - 30
    expect(result['a/b']).toBe(40);
    expect(result['a/c']).toBe(30);
  });

  it('handles deeply nested paths', () => {
    const counts = {'a': 100, 'a/b': 60, 'a/b/c': 60};
    const result = leafify(counts);
    expect(result['a']).toBe(40); // 100 - 60
    expect(result['a/b']).toBe(0); // 60 - 60
    expect(result['a/b/c']).toBe(60);
  });
});

describe('processJsonSpaceUsage', () => {
  it('returns size entries for a flat object', async () => {
    const rows = await withTempJson('{"a": 1, "b": 2}');
    const map = Object.fromEntries(rows);
    // Both keys should appear
    expect(map).toHaveProperty('a');
    expect(map).toHaveProperty('b');
    // Sizes should be positive
    expect(map['a']).toBeGreaterThan(0);
    expect(map['b']).toBeGreaterThan(0);
  });

  it('returns size entries for a nested object', async () => {
    const rows = await withTempJson('{"outer": {"inner": 42}}');
    const map = Object.fromEntries(rows);
    expect(map).toHaveProperty('outer/inner');
    expect(map['outer/inner']).toBeGreaterThan(0);
  });

  it('returns size entries for an array', async () => {
    const rows = await withTempJson('[1, 2, 3]');
    const map = Object.fromEntries(rows);
    // Array elements are keyed as '*'
    expect(map).toHaveProperty('*');
    expect(map['*']).toBeGreaterThan(0);
  });

  it('assigns larger size to a key with more content', async () => {
    const small = await withTempJson('{"a": 1, "b": 1}');
    const large = await withTempJson(
      '{"a": 1, "b": "' + 'x'.repeat(1000) + '"}'
    );
    const smallMap = Object.fromEntries(small);
    const largeMap = Object.fromEntries(large);
    expect(largeMap['b']).toBeGreaterThan(smallMap['b']);
  });
});
