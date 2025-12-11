
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const BankTransaction = sequelize.define('BankTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR'
    },
    type: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING
    },
    category: {
      type: DataTypes.STRING
    },
    isReconciled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bankStatementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bank_statements',
        key: 'id'
      }
    }
  }, {
    tableName: 'bank_transactions',
    timestamps: true
  });

  BankTransaction.associate = (models) => {
    BankTransaction.belongsTo(models.BankStatement, { foreignKey: 'bankStatementId', as: 'bankStatement' });
  };

  return BankTransaction;
};
