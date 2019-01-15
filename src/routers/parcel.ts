import { H256 } from "codechain-primitives/lib";
import { Router } from "express";
import { IndexerContext } from "../context";
import * as ParcelModel from "../models/logic/transaction";

/**
 * @swagger
 * tags:
 *   name: Parcel
 *   description: Parcel management
 * definitions:
 *   Parcel:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: parcel example
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /parcel:
     *   get:
     *     summary: Returns parcels
     *     tags: [Parcel]
     *     parameters:
     *       - name: address
     *         description: sender receiver filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: page
     *         description: page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: itemsPerPage
     *         description: items per page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: query
     *         required: false
     *         type: number
     *     responses:
     *       200:
     *         description: latest parcels
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Parcel'
     */
    router.get("/parcel", async (req, res, next) => {
        const address = req.query.address;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage =
            req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const onlyConfirmed =
            req.query.onlyConfirmed && req.query.onlyConfirmed === "true";
        const confirmThreshold =
            req.query.confirmThreshold &&
            parseInt(req.query.confirmThreshold, 10);
        try {
            const parcelInsts = await ParcelModel.getTransactions({
                address,
                page,
                itemsPerPage,
                onlyConfirmed,
                confirmThreshold
            });
            const parcels = parcelInsts.map(inst => inst.get({ plain: true }));
            res.json(parcels);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /parcel/count:
     *   get:
     *     summary: Returns count of parcels
     *     tags: [Parcel]
     *     parameters:
     *       - name: address
     *         description: sender receiver filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: query
     *         required: false
     *         type: number
     *     responses:
     *       200:
     *         description: count of parcels
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/parcel/count", async (req, res, next) => {
        const address = req.query.address;
        const onlyConfirmed =
            req.query.onlyConfirmed && req.query.onlyConfirmed === "true";
        const confirmThreshold =
            req.query.confirmThreshold &&
            parseInt(req.query.confirmThreshold, 10);
        try {
            const count = await ParcelModel.getNumberOfTransactions({
                address,
                onlyConfirmed,
                confirmThreshold
            });
            res.json(count);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /parcels:
     *   get:
     *     summary: Returns a specific parcel
     *     tags: [Parcel]
     *     responses:
     *       200:
     *         description: pecific parcel
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Parcel'
     */
    router.get("/parcel/:hash", async (req, res, next) => {
        const hashString = req.params.hash;
        try {
            const hash = new H256(hashString);
            const parcelInst = await ParcelModel.getByHash(hash);
            res.json(parcelInst ? parcelInst.get({ plain: true }) : null);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /pending-parcel:
     *   get:
     *     summary: Returns current pending parcels
     *     tags: [Parcel]
     *     parameters:
     *       - name: address
     *         description: sender receiver filter by address
     *         in: query
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: current pending parcels
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Parcel'
     */
    router.get("/pending-parcel", async (req, res, next) => {
        const address = req.query.address;
        try {
            const pendingParcelInsts = await ParcelModel.getPendingTransactions(
                {
                    address
                }
            );
            const pendingParcels = pendingParcelInsts.map(p =>
                p.get({ plain: true })
            );
            res.json(pendingParcels);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /pending-parcel/count:
     *   get:
     *     summary: Returns total count of the pending parcels
     *     tags: [Parcel]
     *     parameters:
     *       - name: address
     *         description: sender receiver filter by address
     *         in: query
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: total count of the pending parcels
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/pending-parcel/count", async (req, res, next) => {
        const address = req.query.address;
        try {
            const count = await ParcelModel.getNumberOfPendingTransactions({
                address
            });
            res.json(count);
        } catch (e) {
            next(e);
        }
    });
}
