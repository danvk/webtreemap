import {flatten, Node, rollup, sort, treeify} from './tree';

describe('treeify', () => {
  it('builds a simple two-level tree', () => {
    const tree = treeify([
      ['a', 10],
      ['b', 20],
    ]);
    expect(tree.children).toHaveLength(2);
    expect(tree.children![0]).toMatchObject({id: 'a', size: 10});
    expect(tree.children![1]).toMatchObject({id: 'b', size: 20});
  });

  it('builds a nested tree from slash-delimited paths', () => {
    const tree = treeify([
      ['a/b', 5],
      ['a/c', 10],
    ]);
    const a = tree.children![0];
    expect(a.id).toBe('a');
    expect(a.children).toHaveLength(2);
    expect(a.children![0]).toMatchObject({id: 'b', size: 5});
    expect(a.children![1]).toMatchObject({id: 'c', size: 10});
  });

  it('strips trailing slashes from paths', () => {
    const tree = treeify([['a/', 7]]);
    expect(tree.children![0]).toMatchObject({id: 'a', size: 7});
  });

  it('throws on duplicate paths', () => {
    expect(() =>
      treeify([
        ['a', 1],
        ['a', 2],
      ])
    ).toThrow();
  });

  it('returns an empty root node for empty input', () => {
    const tree = treeify([]);
    expect(tree).toEqual({size: 0});
  });

  it('handles sibling paths sharing a common ancestor', () => {
    const tree = treeify([
      ['src/a.ts', 100],
      ['src/b.ts', 200],
      ['README.md', 50],
    ]);
    const ids = tree.children!.map(c => c.id);
    expect(ids).toContain('src');
    expect(ids).toContain('README.md');
    const src = tree.children!.find(c => c.id === 'src')!;
    expect(src.children).toHaveLength(2);
  });
});

describe('rollup', () => {
  it('does nothing to a leaf node', () => {
    const n: Node = {size: 5};
    rollup(n);
    expect(n.size).toBe(5);
  });

  it('sets parent size to sum of children when parent size is 0', () => {
    const n: Node = {
      size: 0,
      children: [
        {size: 3},
        {size: 7},
      ],
    };
    rollup(n);
    expect(n.size).toBe(10);
  });

  it('keeps parent size when it already exceeds children sum', () => {
    const n: Node = {
      size: 20,
      children: [
        {size: 3},
        {size: 7},
      ],
    };
    rollup(n);
    expect(n.size).toBe(20);
  });

  it('rolls up recursively', () => {
    const n: Node = {
      size: 0,
      children: [
        {
          size: 0,
          children: [{size: 4}, {size: 6}],
        },
      ],
    };
    rollup(n);
    expect(n.children![0].size).toBe(10);
    expect(n.size).toBe(10);
  });
});

describe('sort', () => {
  it('sorts children by size descending', () => {
    const n: Node = {
      size: 30,
      children: [
        {size: 5},
        {size: 20},
        {size: 10},
      ],
    };
    sort(n);
    expect(n.children!.map(c => c.size)).toEqual([20, 10, 5]);
  });

  it('sorts recursively', () => {
    const n: Node = {
      size: 100,
      children: [
        {
          size: 50,
          children: [{size: 1}, {size: 3}, {size: 2}],
        },
      ],
    };
    sort(n);
    expect(n.children![0].children!.map(c => c.size)).toEqual([3, 2, 1]);
  });

  it('does nothing to a leaf node', () => {
    const n: Node = {size: 5};
    sort(n);
    expect(n).toEqual({size: 5});
  });
});

describe('flatten', () => {
  it('does nothing to a leaf node', () => {
    const n: Node = {id: 'a', size: 5};
    flatten(n);
    expect(n).toEqual({id: 'a', size: 5});
  });

  it('collapses a single-child chain', () => {
    const n: Node = {
      id: 'a',
      size: 10,
      children: [{id: 'b', size: 10}],
    };
    flatten(n);
    expect(n.id).toBe('a/b');
    expect(n.children).toBeUndefined();
  });

  it('does not flatten nodes with multiple children', () => {
    const n: Node = {
      id: 'a',
      size: 10,
      children: [
        {id: 'b', size: 5},
        {id: 'c', size: 5},
      ],
    };
    flatten(n);
    expect(n.id).toBe('a');
    expect(n.children).toHaveLength(2);
  });

  it('flattens recursively', () => {
    const n: Node = {
      id: 'a',
      size: 10,
      children: [
        {
          id: 'b',
          size: 5,
          children: [{id: 'c', size: 5}],
        },
        {id: 'd', size: 5},
      ],
    };
    flatten(n);
    expect(n.children![0].id).toBe('b/c');
    expect(n.children![1].id).toBe('d');
  });

  it('accepts a custom join function', () => {
    const n: Node = {
      id: 'a',
      size: 10,
      children: [{id: 'b', size: 10}],
    };
    flatten(n, (parent, child) => `${parent}::${child}`);
    expect(n.id).toBe('a::b');
  });
});
