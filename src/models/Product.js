import prisma from '../configs/prisma.js';


const findAll = async ({ page = 1, limit = 12, search = '', categoryId = null, brandId = null, sort = 'newest' } = {}) => {
  const skip = (page - 1) * limit; // bỏ qua bao nhiêu sản phẩm

  // Xây dựng điều kiện lọc (where) cho Prisma
  const where = {};

  // Lọc theo category nếu có
  if (categoryId) {
    where.category_id = Number(categoryId);
  }

  // Lọc theo brand nếu có
  if (brandId) {
    where.brand_id = Number(brandId);
  }

  // Lọc theo từ khóa tìm kiếm (tên sản phẩm hoặc mô tả)
  if (search && search.trim() !== '') {
    const keyword = search.trim();
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } }
    ];
  }

  // Xây dựng cách sắp xếp
  let orderBy;
  if (sort === 'price-asc') {
    orderBy = { base_price: 'asc' };
  } else if (sort === 'price-desc') {
    orderBy = { base_price: 'desc' };
  } else {
    orderBy = { id: 'desc' };
  }

  const [products, totalItems] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
    prisma.products.count({ where })
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
    },
    include: {
      product_variants: true
    }
  });

  if (!product) {
    return {
      action: 'not_found'
    };
  }

  const variantIds = product.product_variants.map((variant) => variant.id);

  const [orderItemCount, inventoryTransactionCount] = await Promise.all([
    prisma.order_items.count({
      where: {
        product_id: id
      }
    }),
    variantIds.length > 0
      ? prisma.inventory_transactions.count({
        where: {
          variant_id: {
            in: variantIds
          }
        }
      })
      : 0
  ]);

  if (orderItemCount > 0 || inventoryTransactionCount > 0) {
    const hiddenProduct = await prisma.products.update({
      where: {
        id
      },
      data: {
        is_active: false
      }
    });

    return {
      action: 'hidden',
      product: hiddenProduct,
      reason: {
        orderItemCount,
        inventoryTransactionCount
      }
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.cart_items.deleteMany({
      where: {
        product_id: id
      }
    });

    await tx.product_images.deleteMany({
      where: {
        product_id: id
      }
    });

    await tx.product_variants.deleteMany({
      where: {
        product_id: id
      }
    });

    await tx.products.delete({
      where: {
        id
      }
    });
  });

  return {
    action: 'deleted'
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
    return {
      action: 'not_found'
    };
  }

  const [orderItemCount, inventoryTransactionCount] = await Promise.all([
    prisma.order_items.count({
      where: {
        variant_id: variantId
      }
    }),
    prisma.inventory_transactions.count({
      where: {
        variant_id: variantId
      }
    })
  ]);

  if (orderItemCount > 0 || inventoryTransactionCount > 0) {
    return {
      action: 'blocked',
      product: await findById(variant.product_id),
      reason: {
        orderItemCount,
        inventoryTransactionCount
      }
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.cart_items.deleteMany({
      where: {
        variant_id: variantId
      }
    });

    await tx.product_variants.delete({
      where: {
        id: variantId
      }
    });
  });

  return {
    action: 'deleted',
    product: await findById(variant.product_id)
  };
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
