import { NextRequest } from 'next/server';
import { pool } from '../../../lib/db';

interface SearchFields {
  name: boolean;
  title: boolean;
  artist: boolean;
  producer: boolean;
  engineer: boolean;
  genre: boolean;
  policyId?: boolean;
}

type PaginationResult = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type QueryParams = unknown[];

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) : 12;

    const offset = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const policyLimitParam = searchParams.get('policy_limit');

    const isInitialBrowseRequest = page === 1 &&
      !search &&
      !searchParams.has('genre') &&
      !searchParams.has('releaseType') &&
      !searchParams.has('policyId');

    const applyPolicyLimit = isInitialBrowseRequest || policyLimitParam === 'true';

    let fields: SearchFields;
    try {
      fields = JSON.parse(searchParams.get('fields') || '{}') as SearchFields;
      if (Object.values(fields).filter(Boolean).length === 0) {
        fields = {
          name: false,
          title: false,
          artist: false,
          producer: false,
          engineer: false,
          genre: false
        };
      }
    } catch (e) {
      fields = {
        name: false,
        title: false,
        artist: false,
        producer: false,
        engineer: false,
        genre: false
      };
      console.warn('Failed to parse fields parameter, using defaults', e);
    }

    const genre = searchParams.get('genre')?.trim();
    const releaseType = searchParams.get('releaseType')?.trim();
    const policyId = searchParams.get('policyId')?.trim();


    const usePolicyIdSearch = !applyPolicyLimit && Boolean(fields.policyId && search && !policyId);
    const distinctPolicyIds = applyPolicyLimit || usePolicyIdSearch;

    const baseConditions: string[] = [];
    const searchConditions: string[] = [];
    const params: QueryParams = [];
    let paramCount = 1;

    if (!searchParams) {
      searchConditions.push(`metadata_json-> ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (policyId) {
      baseConditions.push(`policy_id = $${paramCount}`);
      params.push(policyId);
      paramCount++;
    }
    else if (fields.policyId && search) {
      searchConditions.push(`policy_id ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (search && Object.values({ ...fields, policyId: false }).some(Boolean)) {
      if (fields.name) {
        searchConditions.push(`metadata_json->>'name' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (fields.title) {
        searchConditions.push(`metadata_json->'files'->0->'song'->>'song_title' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (fields.artist) {
        searchConditions.push(`metadata_json->'files'->0->'song'->'artists'->0->>'name' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (fields.producer) {
        searchConditions.push(`metadata_json->'files'->0->'song'->>'producer' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (fields.engineer) {
        searchConditions.push(`metadata_json->'files'->0->'song'->>'mastering_engineer' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;

        searchConditions.push(`metadata_json->'files'->0->'song'->>'mix_engineer' ILIKE $${paramCount}`);
        params.push(`%${search}%`);
        paramCount++;
      }
    }

    if (genre) {
      baseConditions.push(`(
        metadata_json->'files'->0->'song'->'genres' ? $${paramCount}
        OR metadata_json->'release'->'genres' ? $${paramCount + 1}
        OR metadata_json->'genres' ? $${paramCount + 2}
      )`);
      params.push(genre);
      params.push(genre);
      params.push(genre);
      paramCount += 3;
    }

    if (releaseType) {
      baseConditions.push(`metadata_json->'release'->>'release_type' = $${paramCount}`);
      params.push(releaseType);
      paramCount++;
    }

    const conditions: string[] = [];

    if (baseConditions.length > 0) {
      conditions.push(`(${baseConditions.join(' AND ')})`);
    }

    if (searchConditions.length > 0) {
      conditions.push(`(${searchConditions.join(' OR ')})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let query: string;
    let countQuery: string;

    if (distinctPolicyIds) {
      query = `
        WITH UniqueAssets AS (
          SELECT DISTINCT ON (policy_id) 
            id, 
            policy_id, 
            asset_name, 
            metadata_version, 
            metadata_json,
            created_at
          FROM cip60.assets
          ${whereClause}
          ORDER BY policy_id, id DESC
        )
        SELECT * FROM UniqueAssets
        ORDER BY policy_id
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      countQuery = `
        SELECT COUNT(DISTINCT policy_id) AS count 
        FROM cip60.assets 
        ${whereClause}
      `;
    } else {
      query = `
        SELECT 
          id, 
          policy_id, 
          asset_name, 
          metadata_version, 
          metadata_json,
          created_at
        FROM cip60.assets
        ${whereClause}
        ORDER BY policy_id, asset_name
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      countQuery = `
        SELECT COUNT(*) AS count 
        FROM cip60.assets 
        ${whereClause}
      `;
    }

    const [assetsResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);

    const pagination: PaginationResult = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };

    return Response.json({
      data: assetsResult.rows,
      pagination,
      success: true
    });

  } catch (error) {
    console.error('Database error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return Response.json(
      {
        error: 'Database error',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        success: false
      },
      { status: 500 }
    );
  }
}