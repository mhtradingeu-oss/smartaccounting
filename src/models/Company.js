const { Model, DataTypes } = require('sequelize');

class Company extends Model {
  static associate(models) {
    Company.hasMany(models.User, {
      foreignKey: 'companyId',
      as: 'users'
    });

    Company.hasMany(models.Invoice, {
      foreignKey: 'companyId',
      as: 'invoices'
    });
  }
}

module.exports = (sequelize) => {
  Company.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      taxId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: false
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Company',
      tableName: 'companies'
    }
  );

  return Company;
};
