
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';
import { asc } from 'drizzle-orm';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const results = await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Get todos failed:', error);
    throw error;
  }
};
