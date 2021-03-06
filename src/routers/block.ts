import { H256 } from "codechain-primitives/lib";
import { Router } from "express";
import * as _ from "lodash";
import { IndexerContext } from "../context";
import * as BlockModel from "../models/logic/block";
import * as TransactionModel from "../models/logic/transaction";
import {
    parseEvaluatedKey,
    syncIfNeeded
} from "../models/logic/utils/middleware";
import { createPaginationResult } from "./pagination";
import {
    blockPaginationSchema,
    blockSchema,
    blockTxPaginationSchema,
    paginationSchema,
    syncSchema,
    validate
} from "./validator";

/**
 * @swagger
 * tags:
 *   name: Block
 *   description: Block management
 * definitions:
 *   Block:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: block example
 */
export function handle(context: IndexerContext, router: Router) {
    /**
     * @swagger
     * /block/latest:
     *   get:
     *     summary: Returns latest block
     *     tags: [Block]
     *     parameters:
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: latest block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get(
        "/block/latest",
        validate({
            query: {
                ...syncSchema
            }
        }),
        syncIfNeeded(context),
        async (_A, res, next) => {
            try {
                const latestBlockInst = await BlockModel.getLatestBlock();
                res.json(
                    latestBlockInst
                        ? latestBlockInst.get({ plain: true })
                        : null
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/count:
     *   get:
     *     summary: Returns total count of the blocks
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: total count of the blocks
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get(
        "/block/count",
        validate({
            query: {
                ...blockSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            try {
                const count = await BlockModel.getNumberOfBlocks({
                    address
                });
                res.json(count);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{hashOrNumber}:
     *   get:
     *     summary: Returns specific block
     *     tags: [Block]
     *     parameters:
     *       - name: hashOrNumber
     *         description: Block hash or Block number
     *         required: true
     *         in: path
     *         type: string
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: specific block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get(
        "/block/:hashOrNumber",
        validate({
            query: {
                ...syncSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const hashOrNumber = req.params.hashOrNumber;
            let hashValue;
            let numberValue;
            // FIXME: Throw an error if hashOrNumber is not hash or number
            try {
                hashValue = new H256(hashOrNumber);
            } catch (e) {
                if (!isNaN(hashOrNumber)) {
                    numberValue = parseInt(hashOrNumber, 10);
                }
            }
            try {
                let latestBlockInst;
                if (hashValue) {
                    latestBlockInst = await BlockModel.getByHash(hashValue);
                } else if (numberValue !== undefined) {
                    latestBlockInst = await BlockModel.getByNumber(numberValue);
                }
                res.json(
                    latestBlockInst
                        ? latestBlockInst.get({ plain: true })
                        : null
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{hashOrNumber}/tx:
     *   get:
     *     summary: Returns the transactions of the specific block
     *     tags: [Block]
     *     parameters:
     *       - name: hashOrNumber
     *         description: Block hash or Block number
     *         required: true
     *         in: path
     *         type: string
     *       - name: itemsPerPage
     *         description: items per page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: firstEvaluatedKey
     *         description: the evaulated key of the first item in the previous page. It will be used for the pagination
     *         in: query
     *         required: false
     *         type: string
     *       - name: lastEvaluatedKey
     *         description: the evaulated key of the last item in the previous page. It will be used for the pagination
     *         in: query
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: Transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get(
        "/block/:hashOrNumber/tx",
        parseEvaluatedKey,
        validate({
            // FIXME: Throw an error if hashOrNumber is not hash or number
            query: {
                ...paginationSchema,
                ...blockTxPaginationSchema
            }
        }),
        async (req, res, next) => {
            const hashOrNumber = req.params.hashOrNumber;
            const itemsPerPage =
                (req.query.itemsPerPage &&
                    parseInt(req.query.itemsPerPage, 10)) ||
                15;
            const firstEvaluatedKey = req.query.firstEvaluatedKey;
            const lastEvaluatedKey = req.query.lastEvaluatedKey;

            try {
                const block =
                    H256.check(hashOrNumber) &&
                    (await BlockModel.getByHash(new H256(hashOrNumber)));
                const txs = await TransactionModel.getTransactionsOfBlock({
                    itemsPerPage: itemsPerPage + 1,
                    blockNumber: block ? block.get().number : hashOrNumber,
                    firstEvaluatedKey,
                    lastEvaluatedKey
                });
                res.json(
                    createPaginationResult({
                        query: {
                            firstEvaluatedKey,
                            lastEvaluatedKey
                        },
                        rows: txs.map(tx => tx.get({ plain: true })),
                        getEvaluatedKey:
                            TransactionModel.createBlockTxEvaluatedKey,
                        itemsPerPage
                    })
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{blockNumber}/tx-count-types:
     *   get:
     *     summary: Returns count of each transaction type in the blockNumber
     *     tags: [Block]
     *     parameters:
     *       - name: blockNumber
     *         description: filter by blockNumber
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: count of each transaction type in the blockNumber
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get("/block/:blockNumber/tx-count-types", async (req, res, next) => {
        const blockNumber = parseInt(req.params.blockNumber, 10);
        try {
            const models = (await TransactionModel.getNumberOfEachTransactionType(
                {
                    blockNumber
                }
            )).map(
                model =>
                    (model.get() as unknown) as { type: string; count: string }
            );
            const counts =
                _.reduce(
                    models.map(item => ({
                        [item.type]: parseInt(item.count, 10)
                    })),
                    _.extend
                ) || {};
            res.json(counts);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /block:
     *   get:
     *     summary: Returns blocks
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: firstEvaluatedKey
     *         description: the evaulated key of the first item in the previous page. It will be used for the pagination
     *         in: query
     *         required: false
     *         type: string
     *       - name: lastEvaluatedKey
     *         description: the evaulated key of the last item in the previous page. It will be used for the pagination
     *         in: query
     *         required: false
     *         type: string
     *       - name: itemsPerPage
     *         description: items per page for the pagination (default 15)
     *         in: query
     *         required: false
     *         type: number
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: blocks
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Block'
     */
    router.get(
        "/block",
        parseEvaluatedKey,
        validate({
            query: {
                ...blockSchema,
                ...paginationSchema,
                ...blockPaginationSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const itemsPerPage =
                (req.query.itemsPerPage &&
                    parseInt(req.query.itemsPerPage, 10)) ||
                15;
            const lastEvaluatedKey = req.query.lastEvaluatedKey;
            const firstEvaluatedKey = req.query.firstEvaluatedKey;
            try {
                const blocks = await BlockModel.getBlocks({
                    address,
                    itemsPerPage: itemsPerPage + 1,
                    firstEvaluatedKey,
                    lastEvaluatedKey
                }).then(instances =>
                    instances.map(i => i.get({ plain: true }))
                );
                res.json(
                    createPaginationResult({
                        query: {
                            firstEvaluatedKey,
                            lastEvaluatedKey
                        },
                        rows: blocks,
                        getEvaluatedKey: BlockModel.createBlockEvaluatedKey,
                        itemsPerPage
                    })
                );
            } catch (e) {
                next(e);
            }
        }
    );
}
