const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    vatNumber: {
      type: DataTypes.STRING
    },
    taxNumber: {
      type: DataTypes.STRING
    },
    registrationNumber: {
      type: DataTypes.STRING
    },
    industry: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'companies',
    timestamps: true
  });

  Company.associate = (models) => {
    Company.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Company.hasMany(models.Invoice, { foreignKey: 'companyId', as: 'invoices' });
  };

  return Company;
};