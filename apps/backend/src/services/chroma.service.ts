import { ChromaClient, type Collection, type EmbeddingFunction, type Metadata } from 'chromadb';
import { env } from '../config/env';

const COLLECTION_NAME = 'wiratek_documents';

export interface ChunkMetadata extends Record<string, string | number | boolean> {
    userId: string;
    fileId: string;
    filename: string;
    chunkIndex: number;
    format: string;
}

export interface ChunkQueryResult {
    id: string;
    text: string;
    metadata: ChunkMetadata;
    distance: number;
}

class LocalEmbeddingFunction implements EmbeddingFunction {
    private pipeline: any = null;
    private loading = false;
    name = 'local-minilm';

    private async getPipeline() {
        if (this.pipeline) return this.pipeline;
        if (this.loading) {
            
            while (this.loading) {
                await new Promise((r) => setTimeout(r, 100));
            }
            return this.pipeline;
        }
        this.loading = true;
        try {
            
            const { pipeline, env: tfEnv } = await import('chromadb-default-embed' as any);
            tfEnv.allowLocalModels = false;
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true,
            });
        } catch (err) {
            console.warn('[ChromaService] Could not load local embedding model:', (err as Error).message);
            this.pipeline = null;
        } finally {
            this.loading = false;
        }
        return this.pipeline;
    }

    async generate(texts: string[]): Promise<number[][]> {
        const pipe = await this.getPipeline();
        if (!pipe) {
            
            const DIM = 384;
            return texts.map(() => new Array(DIM).fill(0));
        }
        const output = await pipe(texts, { pooling: 'mean', normalize: true });
        return output.tolist() as number[][];
    }
}

export class ChromaService {
    private client: ChromaClient;
    private embeddingFn: LocalEmbeddingFunction;
    private _collection: Collection | null = null;

    constructor() {
        this.client = new ChromaClient({ path: env.CHROMA_URL });
        this.embeddingFn = new LocalEmbeddingFunction();
    }

    
    private async getCollection(): Promise<Collection> {
        if (this._collection) return this._collection;

        this._collection = await this.client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: this.embeddingFn,
            metadata: { 'hnsw:space': 'cosine' },
        });

        return this._collection;
    }

    

    async storeChunks(
        fileId: string,
        userId: string,
        filename: string,
        format: string,
        chunks: { text: string; index: number }[],
    ): Promise<void> {
        if (chunks.length === 0) return;

        const collection = await this.getCollection();

        const ids = chunks.map((c) => `${fileId}_chunk_${c.index}`);
        const documents = chunks.map((c) => c.text);
        const metadatas: Metadata[] = chunks.map((c) => ({
            userId,
            fileId,
            filename,
            chunkIndex: c.index,
            format,
        }));

        await collection.upsert({ ids, documents, metadatas });
    }

    

    async queryChunks(
        query: string,
        userId: string,
        fileIds?: string[],
        nResults = 5,
    ): Promise<ChunkQueryResult[]> {
        const collection = await this.getCollection();

        
        let where: Record<string, any> | undefined;

        if (fileIds && fileIds.length === 1) {
            where = { $and: [{ userId: { $eq: userId } }, { fileId: { $eq: fileIds[0] } }] };
        } else if (fileIds && fileIds.length > 1) {
            where = { $and: [{ userId: { $eq: userId } }, { fileId: { $in: fileIds } }] };
        } else {
            where = { userId: { $eq: userId } };
        }

        const results = await collection.query({
            queryTexts: [query],
            nResults,
            where,
            include: ['documents', 'metadatas', 'distances'],
        });

        const ids = results.ids[0] ?? [];
        const documents = results.documents[0] ?? [];
        const metadatas = results.metadatas[0] ?? [];
        const distances = results.distances[0] ?? [];

        return ids.map((id, i) => ({
            id,
            text: documents[i] ?? '',
            metadata: metadatas[i] as unknown as ChunkMetadata,
            distance: distances[i] ?? 1,
        }));
    }

    
    async deleteFileChunks(fileId: string): Promise<void> {
        const collection = await this.getCollection();
        await collection.delete({ where: { fileId: { $eq: fileId } } });
    }

    
    async deleteUserChunks(userId: string): Promise<void> {
        const collection = await this.getCollection();
        await collection.delete({ where: { userId: { $eq: userId } } });
    }

    
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.heartbeat();
            return true;
        } catch {
            return false;
        }
    }
}

export const chromaService = new ChromaService();
