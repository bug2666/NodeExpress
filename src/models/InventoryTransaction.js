import prisma from '../configs/prisma.js';

const recordTransaction = async ({
  variantId,
  quantity,      // số lượng thay đổi (âm = giảm, dương = tăng)
  reason,        // "order_created", "order_cancelled", "stock_adjustment"
  referenceId,   // order_id hoặc null
  createdBy,     // admin_id hoặc null
  notes          // mô tả thêm
}) => {
  return await prisma.inventory_transactions.create({
    data: {
      variant_id: variantId,
      quantity,
      reason,
      reference_id: referenceId,
      created_by: createdBy,
      notes
    }
  });
};

export { recordTransaction };