
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileAttachment = sequelize.define('FileAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name'
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'original_name'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING,
      field: 'mime_type'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'uploaded_by'
    },
    entityType: {
      type: DataTypes.STRING,
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.UUID,
      field: 'entity_id'
    }
  }, {
    tableName: 'file_attachments',
    timestamps: true,
    underscored: true
  });

  FileAttachment.associate = (models) => {
    FileAttachment.belongsTo(models.User, { 
      foreignKey: 'uploadedBy', 
      as: 'uploader' 
    });
  };

  return FileAttachment;
};
