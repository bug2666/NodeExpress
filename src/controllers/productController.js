const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, categoryId, brandId, basePrice, isActive } = req.body;

    if (!name || !description || !categoryId || !brandId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' });
    }

    const newProduct = await Product.createProduct({
      name,
      description,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      basePrice: Number(basePrice ?? 0),
      isActive: isActive === undefined ? 1 : Number(Boolean(isActive))
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, categoryId, brandId, basePrice, isActive } = req.body;

    const updated = await Product.updateProduct(id, {
      name,
      description,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      basePrice: Number(basePrice),
      isActive: Number(Boolean(isActive))
    });

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await Product.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
    }

    return res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createVariant = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { size, color, stock, price, sku } = req.body;

    if (!productId || !size?.trim() || !color?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ size và màu' });
    }

    if (Number(stock) < 0 || Number(price) < 0) {
      return res.status(400).json({ message: 'Tồn kho và giá không được âm' });
    }

    const product = await Product.createVariant(productId, {
      size,
      color,
      stock: Number(stock ?? 0),
      price: Number(price ?? 0),
      sku
    });

    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Biến thể hoặc SKU đã tồn tại' });
    }

    return res.status(500).json({ message: error.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const variantId = Number(req.params.variantId);
    const { size, color, stock, price, sku } = req.body;

    if (!variantId || !size?.trim() || !color?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ size và màu' });
    }

    if (Number(stock) < 0 || Number(price) < 0) {
      return res.status(400).json({ message: 'Tồn kho và giá không được âm' });
    }

    const product = await Product.updateVariant(variantId, {
      size,
      color,
      stock: Number(stock ?? 0),
      price: Number(price ?? 0),
      sku
    });

    return res.json(product);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy biến thể' });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Biến thể hoặc SKU đã tồn tại' });
    }

    return res.status(500).json({ message: error.message });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const variantId = Number(req.params.variantId);
    const product = await Product.deleteVariant(variantId);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy biến thể' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createImage = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { imageUrl, sortOrder } = req.body;

    if (!productId || !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập URL ảnh' });
    }

    const product = await Product.createImage(productId, {
      imageUrl,
      sortOrder: Number(sortOrder ?? 0)
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    const { imageUrl, sortOrder } = req.body;

    if (!imageId || !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập URL ảnh' });
    }

    const product = await Product.updateImage(imageId, {
      imageUrl,
      sortOrder: Number(sortOrder ?? 0)
    });

    return res.json(product);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }

    return res.status(500).json({ message: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    const product = await Product.deleteImage(imageId);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createImage,
  updateImage,
  deleteImage
};
