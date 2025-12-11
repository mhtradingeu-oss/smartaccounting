const { Invoice } = require('../models');

const listInvoices = async (companyId) => {
  return Invoice.findAll({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });
};

const createInvoice = async (data, userId, companyId) => {
  const subtotal = data.subtotal ?? data.amount ?? 0;
  const invoicePayload = {
    invoiceNumber: data.invoiceNumber,
    subtotal,
    amount: data.amount,
    total: data.total ?? subtotal,
    currency: data.currency ?? 'EUR',
    status: data.status ?? 'pending',
    date: data.date || data.issueDate,
    dueDate: data.dueDate,
    clientName: data.clientName,
    userId,
    companyId,
    notes: data.notes || null,
  };

  try {
    const invoice = await Invoice.create(invoicePayload);
    return invoice;
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      error.status = 400;
    }
    throw error;
  }
};

const updateInvoice = async (invoiceId, changes, companyId) => {
  const invoice = await Invoice.findOne({
    where: { id: invoiceId, companyId },
  });

  if (!invoice) {
    return null;
  }

  await invoice.update(changes);
  return invoice;
};

module.exports = {
  listInvoices,
  createInvoice,
  updateInvoice,
};
