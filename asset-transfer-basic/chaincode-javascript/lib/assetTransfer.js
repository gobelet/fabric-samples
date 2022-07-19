/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx, n_tickets) {
        const assets = [
            {
                ID: 'queue1',
                N_queue: 0,
                N_tickets: Number(n_tickets),
                Tickets_owners: [],
                Queue_id_ranks: [],
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, n_queue, n_tickets, tickets_owners, queue_id_ranks) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            N_queue: n_queue,
            N_tickets: n_tickets,
            Tickets_owners: tickets_owners,
            Queue_id_ranks: queue_id_ranks,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // ReadStatus returns the rank stored in the world state with given client id.
    async ReadStatus(ctx, assetId, clientId) {
        const assetJSON = await ctx.stub.getState(assetId); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset = JSON.parse(assetJSON);
        const queue = asset.Queue_id_ranks;
        let rank = -1;
        for (let i in queue) {
            if (queue[i]===clientId) {
                rank = Number(i)+1;
            }
        }
        if (rank===-1) {
            throw new Error(`The client id ${clientId} does not exist`);
        }
        return 'Rank : '+rank.toString()+', Tickets left : '+asset.N_tickets.toString();
        //[rank.valueOf(), asset.N_tickets.valueOf()];
    }

    /*     // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, n_queue, n_tickets, tickets_owners, queue_id_ranks) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            N_queue: n_queue,
            N_tickets: n_tickets,
            Tickets_owners: tickets_owners,
            Queue_id_ranks: queue_id_ranks,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    } */

    // EnterQueue updates an existing asset in the world state with provided parameters.
    async EnterQueue(ctx, assetId, clientId) {
        const assetJSON = await ctx.stub.getState(assetId); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset = JSON.parse(assetJSON);

        const queue = asset.Queue_id_ranks;
        for (let i in queue) {
            if (queue[i]===clientId) {
                throw new Error(`The client id ${clientId} is already in the queue`);
            }
        }

        asset.Queue_id_ranks.push(clientId);

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: assetId,
            N_queue: asset.N_queue+1,
            N_tickets: asset.N_tickets,
            Tickets_owners: asset.Tickets_owners,
            Queue_id_ranks: asset.Queue_id_ranks,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // PayTicket updates an existing asset in the world state with provided parameters.
    async PayTicket(ctx, assetId, clientId) {
        const assetJSON = await ctx.stub.getState(assetId); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset = JSON.parse(assetJSON);

        const queue = asset.Queue_id_ranks;
        let rank=-1;
        for (let i in queue) {
            if (queue[i]===clientId) {
                rank=Number(i)+1;
            }
        }
        if (rank===-1) {
            throw new Error(`The client id ${clientId} is not in the queue`);
        }

        if (rank>asset.N_tickets) {
            throw new Error(`your rank : ${rank.valueOf()} is too high`);
            //return ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        else {
            asset.Queue_id_ranks.splice(rank-1, 1);
            asset.Tickets_owners.push(clientId);
            // overwriting original asset with new asset
            const updatedAsset = {
                ID: assetId,
                N_queue: asset.N_queue-1,
                N_tickets: asset.N_tickets-1,
                Tickets_owners: asset.Tickets_owners,
                Queue_id_ranks: asset.Queue_id_ranks,
            };
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            return ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        }
    }

    // LeaveQueue deletes a given client's rank from the queue.
    async LeaveQueue(ctx, assetId, clientId) {
        const assetJSON = await ctx.stub.getState(assetId);
        if (!assetJSON) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset=JSON.parse(assetJSON);
        const queue = asset.Queue_id_ranks;
        let idx=-1;
        for (let i in queue) {
            if (queue[i]===clientId) {
                idx=Number(i);
            }
        }
        if (idx===-1) {
            throw new Error(`The client id ${clientId} is not in the queue`);
        }

        // overwriting original asset with new asset
        asset.Queue_id_ranks.splice(idx, 1);
        const updatedAsset = {
            ID: assetId,
            N_queue: asset.N_queue-1,
            N_tickets: asset.N_tickets,
            Tickets_owners: asset.Tickets_owners,
            Queue_id_ranks: asset.Queue_id_ranks,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(assetId, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    //AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
