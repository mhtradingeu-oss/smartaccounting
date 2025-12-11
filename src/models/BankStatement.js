module.exports = (sequelize, DataTypes) => {
  const BankStatement = sequelize.define('BankStatement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    iban: {
      type: DataTypes.STRING,
    },
    statementDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    openingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    closingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR',
    },
    filePath: {
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
    tableName: 'bank_statements',
    timestamps: true,
  });

  BankStatement.associate = (models) => {
    BankStatement.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    BankStatement.hasMany(models.BankTransaction, { foreignKey: 'bankStatementId', as: 'transactions' });
  };

  return BankStatement;
};
