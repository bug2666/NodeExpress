const pool = require('../configs/mysql');

const getOrCreateCartByUserId = async (userId) => {
    const [carts] = await pool.execute(
        'SELECT id, user_id, created_at, updated_at FROM carts WHERE user_id = ? LIMIT 1',
        [userId] /* trả về 2 phần là row và fields */
    );

    if (carts[0]) return carts[0];

    const [result] = await pool.execute(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
    ); /* đoạn này sẽ trả về id của hàng mới tạo */

    const [newCartRows] = await pool.execute(
        'SELECT id, user_id, created_at, updated_at FROM carts WHERE id = ? LIMIT 1',
        [result.insertId]
    );  /* sau khi đã tạo mới xong thì lấy dữ liệu của giỏ hàng */

    return newCartRows[0];
};

const getCartItems = async (cartId) => {
    const [rows] = await pool.execute(
        `SELECT
            cart_items.id AS id,
            cart_items.cart_id AS cartId,
            cart_items.product_id AS productId,
            cart_items.variant_id AS variantId,
            cart_items.quantity AS quantity,
            cart_items.unit_price AS unitPrice,
            (cart_items.quantity * cart_items.unit_price) AS subtotal,
            products.name AS productName,
            product_variants.size AS size,
            product_variants.color AS color,
            pi.image_url AS imageUrl
        FROM cart_items
        JOIN products ON products.id = cart_items.product_id
        JOIN product_variants ON product_variants.id = cart_items.variant_id
        LEFT JOIN product_images pi
            ON pi.product_id = products.id
            AND pi.sort_order = (
                SELECT MIN(pi2.sort_order)
                FROM product_images pi2
                WHERE pi2.product_id = products.id
            )
        WHERE cart_items.cart_id = ?
        ORDER BY cart_items.id DESC`,
        [cartId]
    );

    return rows;
};

/*return rows [
  {
    id: 10,
    cartId: 1,
    productId: 5,
    variantId: 12,
    quantity: 2,
    unitPrice: 100000,
    subtotal: 200000,
    productName: "Áo thun",
    size: "L",
    color: "Đen"
  },
] */



const addOrIncreaseCartItem = async (cartId, productId, variantId, quantity) => {

    const [variants] = await pool.execute(
        'SELECT id, product_id, stock, price FROM product_variants WHERE id = ? LIMIT 1',
        [variantId]
    ); /* lấy thông tin biến thể xem có biến thể này không */

    const variant = variants[0];
    if (!variant) throw new Error('Biến thể sản phẩm không tồn tại');
    /* rất hay bỏ qua chú ý  */
    if (variant.product_id !== productId) throw new Error('variantId không thuộc productId');

    const [existingRows] = await pool.execute(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1',
        [cartId, variantId] /* lấy biến thể trong giỏ hàng */
    );

    if (existingRows[0]) {
        const newQty = existingRows[0].quantity + quantity;
        if (newQty > variant.stock) throw new Error('Số lượng vượt quá tồn kho');

        await pool.execute(
            'UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?',
            [newQty, variant.price, existingRows[0].id]
        );
        return;
    }

    if (quantity > variant.stock) throw new Error('Số lượng vượt quá tồn kho');

    await pool.execute(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
        [cartId, productId, variantId, quantity, variant.price]
    );
};

const updateCartItemQuantity = async (cartId, variantId, quantity) => {
    const [variants] = await pool.execute(
        'SELECT stock, price FROM product_variants WHERE id = ? LIMIT 1',
        [variantId]
    );
    const variant = variants[0];
    if (!variant) throw new Error('Biến thể sản phẩm không tồn tại');

    if (quantity > variant.stock) throw new Error('Số lượng vượt quá tồn kho');

    const [result] = await pool.execute(
        'UPDATE cart_items SET quantity = ?, unit_price = ? WHERE cart_id = ? AND variant_id = ?',
        [quantity, variant.price, cartId, variantId]
    );

    return result.affectedRows > 0;
};

const removeCartItem = async (cartId, variantId) => {
    const [result] = await pool.execute(
        'DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?',
        [cartId, variantId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    getOrCreateCartByUserId,
    getCartItems,
    addOrIncreaseCartItem,
    updateCartItemQuantity,
    removeCartItem
};
