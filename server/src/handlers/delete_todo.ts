
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq, gt, sql } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
  try {
    // First, get the todo to be deleted to get its order_index
    const todoToDelete = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (todoToDelete.length === 0) {
      throw new Error('Todo not found');
    }

    const deletedOrderIndex = todoToDelete[0].order_index;

    // Delete the todo
    await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Reorder remaining todos - decrement order_index for all todos with higher order_index
    await db.update(todosTable)
      .set({ 
        order_index: sql`${todosTable.order_index} - 1`,
        updated_at: new Date()
      })
      .where(gt(todosTable.order_index, deletedOrderIndex))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};
