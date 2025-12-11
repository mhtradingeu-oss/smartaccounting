
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR',
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
    },
    vatRate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.19,
    },
    vatAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    reference: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Transaction;
};
