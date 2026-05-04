const pool = require('../configs/mysql');

const findAll = async () => {
  const [rows] = await pool.execute(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.base_price AS basePrice,
      p.is_active AS isActive,
      p.created_at AS createdAt,
      p.updated_at AS updatedAt,
      c.id AS categoryId,
      c.name AS categoryName,
      b.id AS brandId,
      b.name AS brandName,
      pi.image_url AS imageUrl
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_images pi
      ON pi.product_id = p.id
      AND pi.sort_order = (
        SELECT MIN(pi2.sort_order)
        FROM product_images pi2
        WHERE pi2.product_id = p.id
      )
    ORDER BY p.id DESC
  `);

  return rows;
};

const findImagesByProductId = async (productId) => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      image_url AS imageUrl,
      sort_order AS sortOrder,
      created_at AS createdAt
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, id ASC
  `, [productId]);

  return rows;
};

const findVariantsByProductId = async (productId) => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      product_id AS productId,
      size,
      color,
      stock,
      price,
      sku,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM product_variants
    WHERE product_id = ?
    ORDER BY size ASC, color ASC
  `, [productId]);

  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.base_price AS basePrice,
      p.is_active AS isActive,
      p.created_at AS createdAt,
      p.updated_at AS updatedAt,
      c.id AS categoryId,
      c.name AS categoryName,
      b.id AS brandId,
      b.name AS brandName,
      pi.image_url AS imageUrl
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_images pi
      ON pi.product_id = p.id
      AND pi.sort_order = (
        SELECT MIN(pi2.sort_order)
        FROM product_images pi2
        WHERE pi2.product_id = p.id
      )
    WHERE p.id = ?
    LIMIT 1
  `, [id]);

  const product = rows[0];

  if (!product) {
    return null;
  }

  const images = await findImagesByProductId(id);
  const variants = await findVariantsByProductId(id);

  return {
    ...product,
    images,
    variants
  };
};

const createProduct = async ({ name, description, categoryId, brandId, basePrice, isActive }) => {
  const [result] = await pool.execute(`
    INSERT INTO products (name, description, category_id, brand_id, base_price, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    name?.trim(),
    description,
    categoryId,
    brandId,
    basePrice ?? 0,
    isActive ?? 1
  ]);

  return findById(result.insertId);
};

const updateProduct = async (id, { name, description, categoryId, brandId, basePrice, isActive }) => {
  const [result] = await pool.execute(`
    UPDATE products
    SET name = ?, description = ?, category_id = ?, brand_id = ?, base_price = ?, is_active = ?
    WHERE id = ?
  `, [
    name?.trim(),
    description,
    categoryId,
    brandId,
    basePrice,
    isActive,
    id
  ]);

  if (result.affectedRows === 0) return null;
  return findById(id);
};

const deleteProduct = async (id) => {
  const [result] = await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, createProduct, updateProduct, deleteProduct };
