import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../config/database';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
    console.log('⏳ Running migrations...');

    try {
        await migrate(db, {
            migrationsFolder: path.join(__dirname, './migrations'),
        });

        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations()
        .then(() => {
            console.log('✨ Migration process finished');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration process failed:', error);
            process.exit(1);
        });
}
