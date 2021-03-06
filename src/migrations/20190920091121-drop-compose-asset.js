"use strict";
const tableName = "ComposeAssets";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName, { force: true });
    },

    down: (queryInterface, DataTypes) => {
        return queryInterface.createTable(tableName, {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },

            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            approvals: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            input: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },

            createdAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            }
        });
    }
};
