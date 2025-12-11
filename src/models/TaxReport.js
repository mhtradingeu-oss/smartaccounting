const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const TaxReport = sequelize.define('TaxReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reportType: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: false
    },
    period: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    taxData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
      defaultValue: 'draft'
    },
    submittedAt: {
      type: DataTypes.DATE
    },
    elsterStatus: {
      type: DataTypes.STRING
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
    tableName: 'tax_reports',
    timestamps: true
  });

  TaxReport.associate = (models) => {
    TaxReport.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return TaxReport;
};