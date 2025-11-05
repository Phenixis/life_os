import { db } from '../lib/db/drizzle';
import { Schema } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Starting task state migration...');
    
    // Update tasks that are completed to have state "done"
    const completedResult = await db
        .update(Schema.Task.Task.table)
        .set({ state: Schema.Task.Task.State.DONE })
        .where(sql`${Schema.Task.Task.table.completed_at} IS NOT NULL`);
    
    console.log(`Updated completed tasks to state "done"`);
    
    // Update tasks that are not completed to have state "to do"
    const uncompletedResult = await db
        .update(Schema.Task.Task.table)
        .set({ state: Schema.Task.Task.State.TODO })
        .where(sql`${Schema.Task.Task.table.completed_at} IS NULL`);
    
    console.log(`Updated uncompleted tasks to state "to do"`);
    
    console.log('Task state migration complete!');
}

main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});

