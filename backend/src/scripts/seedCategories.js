'use strict';

const { withTransaction } = require('../config/database');
const { TAXONOMY_TREE, slugifyCategoryName } = require('../../../shared/categoryTaxonomy');

function flatten(nodes, parentSlug = null, depth = 0, rows = []) {
  nodes.forEach((node, position) => {
    const slug = slugifyCategoryName(node.name);
    rows.push({
      name: node.name,
      slug,
      parentSlug,
      position,
      depth,
      icon: null,
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      flatten(node.children, slug, depth + 1, rows);
    }
  });
  return rows;
}

async function seedCategories() {
  const rows = flatten(TAXONOMY_TREE);

  await withTransaction(async (client) => {
    await client.query(`
      WITH RECURSIVE to_delete AS (
        SELECT id
        FROM categories
        WHERE LOWER(name) = 'test'
           OR LOWER(slug) = 'test'

        UNION ALL

        SELECT c.id
        FROM categories c
        INNER JOIN to_delete td ON c.parent_id = td.id
      )
      DELETE FROM categories
      WHERE id IN (SELECT id FROM to_delete)
    `);

    const slugToId = new Map();

    for (const row of rows) {
      const parentId = row.parentSlug ? slugToId.get(row.parentSlug) ?? null : null;
      const result = await client.query(
        `
          INSERT INTO categories (name, slug, parent_id, position, sort_order, icon)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            parent_id = EXCLUDED.parent_id,
            position = EXCLUDED.position,
            sort_order = EXCLUDED.sort_order,
            icon = COALESCE(EXCLUDED.icon, categories.icon)
          RETURNING id, slug
        `,
        [row.name, row.slug, parentId, row.position, row.position, row.icon]
      );
      slugToId.set(result.rows[0].slug, result.rows[0].id);
    }
  });
}

if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('Categories seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[seedCategories]', err);
      process.exit(1);
    });
}

module.exports = {
  seedCategories,
};
