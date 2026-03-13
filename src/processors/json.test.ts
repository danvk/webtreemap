import {getJsonSpaceUsageFromStr, leafify} from './json';

function parse(json: string): Record<string, number> {
  return Object.fromEntries(getJsonSpaceUsageFromStr(json));
}

describe('leafify', () => {
  it('leaves entries without children unchanged', () => {
    const counts = {a: 10, b: 20};
    const result = leafify(counts);
    expect(result).toEqual({a: 10, b: 20});
  });

  it('subtracts child sizes from parent', () => {
    const counts = {a: 100, 'a/b': 40, 'a/c': 30};
    const result = leafify(counts);
    expect(result['a']).toBe(30); // 100 - 40 - 30
    expect(result['a/b']).toBe(40);
    expect(result['a/c']).toBe(30);
  });

  it('handles deeply nested paths', () => {
    const counts = {a: 100, 'a/b': 60, 'a/b/c': 60};
    const result = leafify(counts);
    expect(result['a']).toBe(40); // 100 - 60
    expect(result['a/b']).toBe(0); // 60 - 60
    expect(result['a/b/c']).toBe(60);
  });
});

describe('getJsonSpaceUsageFromStr', () => {
  it('returns size entries for a flat object', () => {
    const map = parse('{"a": 1, "b": 2}');
    expect(map).toHaveProperty('a');
    expect(map).toHaveProperty('b');
    expect(map['a']).toBeGreaterThan(0);
    expect(map['b']).toBeGreaterThan(0);
  });

  it('returns size entries for a nested object', () => {
    const map = parse('{"outer": {"inner": 42}}');
    expect(map).toHaveProperty('outer/inner');
    expect(map['outer/inner']).toBeGreaterThan(0);
  });

  it('returns size entries for an array', () => {
    const map = parse('[1, 2, 3]');
    expect(map).toHaveProperty('*');
    expect(map['*']).toBeGreaterThan(0);
  });

  it('assigns larger size to a key with more content', () => {
    const small = parse('{"a": 1, "b": 1}');
    const large = parse('{"a": 1, "b": "' + 'x'.repeat(1000) + '"}');
    expect(large['b']).toBeGreaterThan(small['b']);
  });

  it('does not crash on empty arrays', () => {
    expect(() => parse('[]')).not.toThrow();
  });

  it('does not crash on nested empty arrays', () => {
    expect(() => parse('{"a": [], "b": []}')).not.toThrow();
    const map = parse('{"a": [], "b": []}');
    expect(map).toHaveProperty('a');
    expect(map).toHaveProperty('b');
  });
});
