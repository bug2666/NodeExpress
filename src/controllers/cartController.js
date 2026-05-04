const Cart = require('../models/Cart');

const getMyCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.getOrCreateCartByUserId(userId);
    const items = await Cart.getCartItems(cart.id);

    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.json({
      cartId: cart.id,
      userId: cart.user_id,
      items,
      total
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, variantId, quantity } = req.body;

    if (!productId || !variantId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Thiếu hoặc sai dữ liệu đầu vào' });
    }

    const cart = await Cart.getOrCreateCartByUserId(userId);

    await Cart.addOrIncreaseCartItem(
      cart.id,
      Number(productId),
      Number(variantId),
      Number(quantity)
    );

    /* để hiển thị kết quả ra */
    const items = await Cart.getCartItems(cart.id);
    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.status(201).json({ message: 'Đã thêm vào giỏ hàng', cartId: cart.id, items, total });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const variantId = Number(req.params.variantId);
    const { quantity } = req.body;

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    }

    const cart = await Cart.getOrCreateCartByUserId(userId);
    const updated = await Cart.updateCartItemQuantity(cart.id, variantId, Number(quantity));

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy item trong giỏ' });
    }

    const items = await Cart.getCartItems(cart.id);
    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.json({ message: 'Cập nhật giỏ hàng thành công', cartId: cart.id, items, total });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const variantId = Number(req.params.variantId);

    const cart = await Cart.getOrCreateCartByUserId(userId);
    const deleted = await Cart.removeCartItem(cart.id, variantId);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy item để xóa' });
    }

    const items = await Cart.getCartItems(cart.id);
    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.json({ message: 'Xóa item thành công', cartId: cart.id, items, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem
};
