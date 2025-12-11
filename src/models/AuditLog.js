module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.STRING,
    },
    oldValues: {
      type: DataTypes.JSON,
    },
    newValues: {
      type: DataTypes.JSON,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'audit_logs',
    timestamps: true,
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
