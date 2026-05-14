import prisma from '../configs/prisma.js';


const findAll = async ({ page = 1, limit = 12 } = {}) => {
  const skip = (page - 1) * limit; // bỏ qua bao nhiêu sản phẩm

  const [products, totalItems] = await Promise.all([
    prisma.products.findMany({
      skip,
      take: limit,
      orderBy: {
        id: 'desc'
      },
      include: {
        categories: true,
        brands: true,
        product_images: {
          orderBy: [
            { sort_order: 'asc' },
            { id: 'asc' }
          ],
          take: 1
        }
      }
    }),
    prisma.products.count()
  ]);

  return {
    products: products.map((product) => {
      const firstImage = product.product_images[0];

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.base_price,
        isActive: product.is_active ? 1 : 0,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        categoryId: product.categories.id,
        categoryName: product.categories.name,
        brandId: product.brands.id,
        brandName: product.brands.name,
        imageUrl: firstImage?.image_url || null
      };
    }),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
};


const findImagesByProductId = async (productId) => {
  const images = await prisma.product_images.findMany({
    where: {
      product_id: productId
    },
    orderBy: [
      { sort_order: 'asc' },
      { id: 'asc' }
    ]
  });
  return images.map((image) => {
    return {
      id: image.id,
      imageUrl: image.image_url,
      sortOrder: image.sort_order,
      createdAt: image.created_at
    };
  });
}


const findVariantsByProductId = async (productId) => {
  const variants = await prisma.product_variants.findMany({
    where: {
      product_id: productId
    },
    orderBy: [
      { size: 'asc' },
      { color: 'asc' }
    ]
  });

  return variants.map((variant) => {
    return {
      id: variant.id,
      productId: variant.product_id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: variant.price,
      sku: variant.sku,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at
    };
  });

}


const findById = async (id) => {
  const product = await prisma.products.findUnique({
    where: {
      id
    },
    include: {
      categories: true,
      brands: true,
      product_images: {
        orderBy: [
          { sort_order: 'asc' },
          { id: 'asc' }
        ],
        take: 1
      }
    }
  });

  if (!product) {
    return null;
  }

  const firstImage = product.product_images[0];
  const images = await findImagesByProductId(id);
  const variants = await findVariantsByProductId(id);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    basePrice: product.base_price,
    isActive: product.is_active ? 1 : 0,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    categoryId: product.categories.id,
    categoryName: product.categories.name,
    brandId: product.brands.id,
    brandName: product.brands.name,
    imageUrl: firstImage?.image_url || null,
    images,
    variants
  };
};

const createProduct = async ({ name, description, categoryId, brandId, basePrice, isActive }) => {
  const product = await prisma.products.create({
    data: {
      name: name?.trim(),
      description,
      category_id: categoryId,
      brand_id: brandId,
      base_price: basePrice ?? 0,
      is_active: Boolean(isActive ?? 1)
    }
  });

  return findById(product.id);
};

const updateProduct = async (id, { name, description, categoryId, brandId, basePrice, isActive }) => {
  const existingProduct = await prisma.products.findUnique({
    where: {
      id
    }
  });

  if (!existingProduct) {
    return null;
  }

  await prisma.products.update({
    where: {
      id
    },
    data: {
      name: name?.trim(),
      description,
      category_id: categoryId,
      brand_id: brandId,
      base_price: basePrice,
      is_active: Boolean(isActive)
    }
  });

  return findById(id);
};

const deleteProduct = async (id) => {
  const product = await prisma.products.findUnique({
    where: {
      id
    }
  });

  if (!product) {
    return {
      deleted: false,
      reason: 'not_found'
    };
  }

  /* query 1 lúc 4 dữ liệu con xem có không */
  const [imageCount, variantCount, cartItemCount, orderItemCount] = await Promise.all([
    prisma.product_images.count({
      where: {
        product_id: id
      }
    }),
    prisma.product_variants.count({
      where: {
        product_id: id
      }
    }),
    prisma.cart_items.count({
      where: {
        product_id: id
      }
    }),
    prisma.order_items.count({
      where: {
        product_id: id
      }
    })
  ]);

  const blockers = [];

  if (imageCount > 0) {
    blockers.push(`Còn ${imageCount} ảnh sản phẩm. Hãy xóa ảnh trước.`);
  }

  if (variantCount > 0) {
    blockers.push(`Còn ${variantCount} biến thể size/màu. Hãy xóa biến thể trước.`);
  }

  if (cartItemCount > 0) {
    blockers.push(`Sản phẩm đang có trong ${cartItemCount} giỏ hàng.`);
  }

  if (orderItemCount > 0) {
    blockers.push(`Sản phẩm đã xuất hiện trong ${orderItemCount} đơn hàng.`);
  }

  if (blockers.length > 0) {
    return {
      deleted: false,
      reason: 'has_related_data',
      blockers
    };
  }

  await prisma.products.delete({
    where: {
      id
    }
  });

  return {
    deleted: true
  };
};

const createVariant = async (productId, { size, color, stock, price, sku }) => {
  await prisma.product_variants.create({
    data: {
      product_id: productId,
      size: size.trim(),
      color: color.trim(),
      stock,
      price,
      sku: sku?.trim() || null
    }
  });

  return findById(productId);
};

const updateVariant = async (variantId, { size, color, stock, price, sku }) => {
  const variant = await prisma.product_variants.update({
    where: {
      id: variantId
    },
    data: {
      size: size.trim(),
      color: color.trim(),
      stock,
      price,
      sku: sku?.trim() || null
    }
  });

  return findById(variant.product_id);
};

const deleteVariant = async (variantId) => {
  const variant = await prisma.product_variants.findUnique({
    where: {
      id: variantId
    }
  });

  if (!variant) {
    return null;
  }

  await prisma.product_variants.delete({
    where: {
      id: variantId
    }
  });

  return findById(variant.product_id);
};

const createImage = async (productId, { imageUrl, sortOrder }) => {
  await prisma.product_images.create({
    data: {
      product_id: productId,
      image_url: imageUrl.trim(),
      sort_order: sortOrder ?? 0
    }
  });

  return findById(productId);
};

const updateImage = async (imageId, { imageUrl, sortOrder }) => {
  const image = await prisma.product_images.update({
    where: {
      id: imageId
    },
    data: {
      image_url: imageUrl.trim(),
      sort_order: sortOrder ?? 0
    }
  });

  return findById(image.product_id);
};

const deleteImage = async (imageId) => {
  const image = await prisma.product_images.findUnique({
    where: {
      id: imageId
    }
  });

  if (!image) {
    return null;
  }

  await prisma.product_images.delete({
    where: {
      id: imageId
    }
  });

  return findById(image.product_id);
};
export {
  findAll,
  findById,
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
