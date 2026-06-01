'use strict';

function normalizeSortValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCategoryTree(rows = []) {
  const byId = new Map();
  const roots = [];

  for (const row of rows) {
    byId.set(Number(row.id), {
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      icon: row.icon ?? null,
      position: normalizeSortValue(row.position ?? row.sort_order ?? 0),
      parent_id: row.parent_id == null ? null : Number(row.parent_id),
      children: [],
    });
  }

  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr'));
    for (const node of nodes) {
      sortNodes(node.children);
      node.subcategories = node.children;
    }
    return nodes;
  };

  return sortNodes(roots);
}

function findCategoryNodeBySlug(tree, slug) {
  if (!slug) return null;
  const stack = [...(Array.isArray(tree) ? tree : [])];

  while (stack.length > 0) {
    const node = stack.shift();
    if (!node) continue;
    if (node.slug === slug) return node;
    if (Array.isArray(node.children) && node.children.length > 0) {
      stack.unshift(...node.children);
    }
  }

  return null;
}

function collectDescendantIds(node) {
  if (!node) return [];
  const ids = [Number(node.id)];
  const stack = [...(node.children || [])];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    ids.push(Number(current.id));
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.push(...current.children);
    }
  }

  return ids;
}

module.exports = {
  buildCategoryTree,
  collectDescendantIds,
  findCategoryNodeBySlug,
};
