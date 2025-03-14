import { pool, executeQuery, executeTransaction } from '@/lib/db';
import { PoolClient } from 'pg';
import { MusicToken, MusicTokenQueryParams, MusicTokenMetadata } from './music-token-types';

export async function getMusicTokensByAddress(
    address: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ tokens: MusicToken[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const query = `
    SELECT 
      a.id, a.policy_id, a.asset_name, a.metadata_version, 
      a.metadata_json, a.created_at, a.fingerprint,
      o.quantity
    FROM cip60.assets a
    JOIN cip60.asset_ownership o ON a.id = o.asset_id
    WHERE o.owner_address = $1
    ORDER BY a.created_at DESC
    LIMIT $2 OFFSET $3
  `;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM cip60.assets a
    JOIN cip60.asset_ownership o ON a.id = o.asset_id
    WHERE o.owner_address = $1
  `;

    const [tokensResult, countResult] = await Promise.all([
        executeQuery<MusicToken>(query, [address, limit, offset]),
        executeQuery<{ total: string }>(countQuery, [address])
    ]);

    return {
        tokens: tokensResult,
        total: parseInt(countResult[0]?.total || '0', 10)
    };
}

export async function getMusicTokensByPolicy(
    policyId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ tokens: MusicToken[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const query = `
    SELECT 
      id, policy_id, asset_name, metadata_version, 
      metadata_json, created_at, fingerprint,
      (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = assets.id) as quantity
    FROM cip60.assets
    WHERE policy_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM cip60.assets
    WHERE policy_id = $1
  `;

    const [tokensResult, countResult] = await Promise.all([
        executeQuery<MusicToken>(query, [policyId, limit, offset]),
        executeQuery<{ total: string }>(countQuery, [policyId])
    ]);

    return {
        tokens: tokensResult,
        total: parseInt(countResult[0]?.total || '0', 10)
    };
}

export async function searchMusicTokens(
    params: MusicTokenQueryParams
): Promise<{ tokens: MusicToken[]; pagination: { total: number; page: number; limit: number; pages: number } }> {
    const {
        search,
        searchFields = { name: true, title: true, artist: true },
        genre,
        releaseType,
        page = 1,
        limit = 12,
        policy_limit
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    // Build search conditions
    if (search) {
        const searchConditions: string[] = [];

        if (searchFields.name) {
            searchConditions.push(`metadata_json->>'name' ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (searchFields.title) {
            searchConditions.push(`metadata_json->'files'->0->'song'->>'song_title' ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (searchFields.artist) {
            searchConditions.push(`metadata_json->'files'->0->'song'->'artists'->0->>'name' ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (searchFields.producer) {
            searchConditions.push(`metadata_json->'files'->0->'song'->>'producer' ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (searchFields.engineer) {
            searchConditions.push(`
        (metadata_json->'files'->0->'song'->>'mastering_engineer' ILIKE $${paramIndex} OR
         metadata_json->'files'->0->'song'->>'mix_engineer' ILIKE $${paramIndex})
      `);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (searchConditions.length > 0) {
            conditions.push(`(${searchConditions.join(' OR ')})`);
        }
    }

    // Filter by genre
    if (genre) {
        conditions.push(`
      (metadata_json->'files'->0->'song'->'genres' ? $${paramIndex} OR 
       metadata_json->'release'->'genres' ? $${paramIndex} OR 
       metadata_json->'genres' ? $${paramIndex})
    `);
        queryParams.push(genre);
        paramIndex++;
    }

    // Filter by release type
    if (releaseType) {
        conditions.push(`metadata_json->'release'->>'release_type' = $${paramIndex}`);
        queryParams.push(releaseType);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let query: string;
    let countQuery: string;

    if (policy_limit === 'true') {
        // Get only one asset per policy ID (distinct policy IDs)
        query = `
      WITH UniqueAssets AS (
        SELECT DISTINCT ON (policy_id) 
          id, policy_id, asset_name, metadata_version, metadata_json, created_at, fingerprint,
          (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = assets.id) as quantity
        FROM cip60.assets
        ${whereClause}
        ORDER BY policy_id, id DESC
      )
      SELECT * FROM UniqueAssets
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        countQuery = `
      SELECT COUNT(DISTINCT policy_id) AS total 
      FROM cip60.assets 
      ${whereClause}
    `;
    } else {
        // Get all assets
        query = `
      SELECT 
        id, policy_id, asset_name, metadata_version, metadata_json, created_at, fingerprint,
        (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = assets.id) as quantity
      FROM cip60.assets
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        countQuery = `
      SELECT COUNT(*) AS total 
      FROM cip60.assets 
      ${whereClause}
    `;
    }

    queryParams.push(limit, offset);

    const [tokensResult, countResult] = await Promise.all([
        executeQuery<MusicToken>(query, queryParams),
        executeQuery<{ total: string }>(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    ]);

    const total = parseInt(countResult[0]?.total || '0', 10);

    return {
        tokens: tokensResult,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
}

export async function getMusicTokenById(id: number): Promise<MusicToken | null> {
    const query = `
    SELECT 
      id, policy_id, asset_name, metadata_version, metadata_json, created_at, fingerprint,
      (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = assets.id) as quantity
    FROM cip60.assets
    WHERE id = $1
  `;

    const result = await executeQuery<MusicToken>(query, [id]);
    return result.length > 0 ? result[0] : null;
}

export async function getMusicTokenByAsset(policyId: string, assetName: string): Promise<MusicToken | null> {
    const query = `
    SELECT 
      id, policy_id, asset_name, metadata_version, metadata_json, created_at, fingerprint,
      (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = assets.id) as quantity
    FROM cip60.assets
    WHERE policy_id = $1 AND asset_name = $2
  `;

    const result = await executeQuery<MusicToken>(query, [policyId, assetName]);
    return result.length > 0 ? result[0] : null;
}

export async function insertMusicToken(
    token: Omit<MusicToken, 'id' | 'created_at' | 'updated_at' | 'quantity'>,
    ownerAddress?: string
): Promise<MusicToken> {
    return executeTransaction(async (client: PoolClient) => {
        const insertQuery = `
      INSERT INTO cip60.assets (
        policy_id, asset_name, fingerprint, metadata_version, metadata_json
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (policy_id, asset_name) DO UPDATE SET
        metadata_json = EXCLUDED.metadata_json,
        metadata_version = EXCLUDED.metadata_version,
        updated_at = NOW()
      RETURNING id, policy_id, asset_name, metadata_version, metadata_json, created_at, fingerprint
    `;

        const result = await client.query<MusicToken>(insertQuery, [
            token.policy_id,
            token.asset_name,
            token.fingerprint,
            token.metadata_version,
            token.metadata_json
        ]);

        const insertedToken = result.rows[0];

        if (ownerAddress) {
            const ownershipQuery = `
        INSERT INTO cip60.asset_ownership (
          asset_id, owner_address, quantity
        ) VALUES ($1, $2, 1)
        ON CONFLICT (asset_id, owner_address) DO UPDATE SET
          quantity = cip60.asset_ownership.quantity + 1
      `;

            await client.query(ownershipQuery, [insertedToken.id, ownerAddress]);

            // Create analytics record if it doesn't exist
            await client.query(`
        INSERT INTO cip60.asset_analytics (asset_id)
        VALUES ($1)
        ON CONFLICT (asset_id) DO NOTHING
      `, [insertedToken.id]);
        }

        return {
            ...insertedToken,
            quantity: 1
        };
    });
}

export async function updateMusicTokenPlayCount(
    assetId: number,
    userAddress: string
): Promise<void> {
    await executeTransaction(async (client: PoolClient) => {
        // Update play count
        await client.query(`
      INSERT INTO cip60.asset_analytics (asset_id, play_count, last_played)
      VALUES ($1, 1, NOW())
      ON CONFLICT (asset_id) DO UPDATE SET
        play_count = cip60.asset_analytics.play_count + 1,
        last_played = NOW()
    `, [assetId]);

        // Record play event in user history if needed
        // This could be implemented in a separate user_play_history table
    });
}

export async function toggleFavoriteToken(
    assetId: number,
    userAddress: string
): Promise<boolean> {
    return executeTransaction(async (client: PoolClient) => {
        // Check if favorite exists
        const checkResult = await client.query(`
      SELECT id FROM cip60.user_favorites
      WHERE user_address = $1 AND asset_id = $2
    `, [userAddress, assetId]);

        const isFavorite = checkResult.rows.length > 0;

        if (isFavorite) {
            // Remove from favorites
            await client.query(`
        DELETE FROM cip60.user_favorites
        WHERE user_address = $1 AND asset_id = $2
      `, [userAddress, assetId]);

            // Decrement like count
            await client.query(`
        UPDATE cip60.asset_analytics
        SET like_count = GREATEST(0, like_count - 1)
        WHERE asset_id = $1
      `, [assetId]);

            return false;
        } else {
            // Add to favorites
            await client.query(`
        INSERT INTO cip60.user_favorites (user_address, asset_id)
        VALUES ($1, $2)
      `, [userAddress, assetId]);

            // Increment like count
            await client.query(`
        INSERT INTO cip60.asset_analytics (asset_id, like_count)
        VALUES ($1, 1)
        ON CONFLICT (asset_id) DO UPDATE SET
          like_count = cip60.asset_analytics.like_count + 1
      `, [assetId]);

            return true;
        }
    });
}

export async function getUserFavorites(
    userAddress: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ tokens: MusicToken[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const query = `
    SELECT 
      a.id, a.policy_id, a.asset_name, a.metadata_version, 
      a.metadata_json, a.created_at, a.fingerprint,
      (SELECT SUM(quantity) FROM cip60.asset_ownership WHERE asset_id = a.id) as quantity
    FROM cip60.assets a
    JOIN cip60.user_favorites f ON a.id = f.asset_id
    WHERE f.user_address = $1
    ORDER BY f.created_at DESC
    LIMIT $2 OFFSET $3
  `;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM cip60.user_favorites
    WHERE user_address = $1
  `;

    const [tokensResult, countResult] = await Promise.all([
        executeQuery<MusicToken>(query, [userAddress, limit, offset]),
        executeQuery<{ total: string }>(countQuery, [userAddress])
    ]);

    return {
        tokens: tokensResult,
        total: parseInt(countResult[0]?.total || '0', 10)
    };
}

export async function isMusicToken(metadata: unknown): Promise<boolean> {
    try {
        const metadataObj = metadata as MusicTokenMetadata;

        if (!metadataObj) return false;

        // Check if this has a music_metadata_version field
        if (typeof metadataObj.music_metadata_version === 'number' ||
            typeof metadataObj.music_metadata_version === 'string') {
            return true;
        }

        // Check if there are files with song data
        if (Array.isArray(metadataObj.files) &&
            metadataObj.files.length > 0 &&
            metadataObj.files.some(file =>
                file.mediaType?.startsWith('audio/') ||
                (file.song && typeof file.song === 'object')
            )) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}