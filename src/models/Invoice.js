const { Model, DataTypes } = require('sequelize');

class Invoice extends Model {
  static associate(models) {
    Invoice.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Invoice.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });
  }
}

module.exports = (sequelize) => {
  Invoice.init(
    {
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      clientName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Invoice',
      tableName: 'invoices',
    },
  );

  return Invoice;
};
