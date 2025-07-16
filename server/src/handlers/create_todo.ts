
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';
import { sql } from 'drizzle-orm';

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  try {
    // Get the next available order_index (highest current index + 1)
    const maxOrderResult = await db.select({
      maxOrder: sql<number>`COALESCE(MAX(${todosTable.order_index}), -1)`
    })
    .from(todosTable)
    .execute();

    const nextOrderIndex = maxOrderResult[0].maxOrder + 1;

    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description,
        order_index: nextOrderIndex
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
};
