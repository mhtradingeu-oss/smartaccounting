const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientEmail: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    clientAddress: {
      type: DataTypes.TEXT
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    vatAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    vatRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.19
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR'
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'cancelled'),
      defaultValue: 'draft'
    },
    notes: {
      type: DataTypes.TEXT
    },
    filePath: {
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.UUID,
      references: {
        model: 'companies',
        key: 'id'
      }
    }
  }, {
    tableName: 'invoices',
    timestamps: true
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Invoice.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  };

  return Invoice;
};