
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ReorderTodosInput, type Todo } from '../schema';
import { eq, gte, lt, and, asc, gt, lte, sql } from 'drizzle-orm';

export const reorderTodos = async (input: ReorderTodosInput): Promise<Todo[]> => {
  try {
    // Get the current todo to find its current order_index
    const currentTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.todoId))
      .limit(1)
      .execute();

    if (currentTodo.length === 0) {
      throw new Error('Todo not found');
    }

    const currentOrderIndex = currentTodo[0].order_index;
    const newOrderIndex = input.newOrderIndex;

    // If the order index hasn't changed, no need to update
    if (currentOrderIndex === newOrderIndex) {
      return await db.select()
        .from(todosTable)
        .orderBy(asc(todosTable.order_index))
        .execute();
    }

    // Moving item down (increasing order_index)
    if (newOrderIndex > currentOrderIndex) {
      // Shift all items between current position and new position up by 1
      await db.update(todosTable)
        .set({ 
          order_index: sql`${todosTable.order_index} - 1`,
          updated_at: new Date()
        })
        .where(
          and(
            gt(todosTable.order_index, currentOrderIndex),
            lte(todosTable.order_index, newOrderIndex)
          )
        )
        .execute();
    }
    // Moving item up (decreasing order_index)
    else {
      // Shift all items between new position and current position down by 1
      await db.update(todosTable)
        .set({ 
          order_index: sql`${todosTable.order_index} + 1`,
          updated_at: new Date()
        })
        .where(
          and(
            gte(todosTable.order_index, newOrderIndex),
            lt(todosTable.order_index, currentOrderIndex)
          )
        )
        .execute();
    }

    // Update the moved todo to its new position
    await db.update(todosTable)
      .set({ 
        order_index: newOrderIndex,
        updated_at: new Date()
      })
      .where(eq(todosTable.id, input.todoId))
      .execute();

    // Return all todos ordered by order_index
    return await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();
  } catch (error) {
    console.error('Todo reordering failed:', error);
    throw error;
  }
};
