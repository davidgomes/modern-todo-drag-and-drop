
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq, asc } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a todo', async () => {
    // Create test todo
    const result = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo',
        order_index: 0
      })
      .returning()
      .execute();

    const todoId = result[0].id;

    const input: DeleteTodoInput = {
      id: todoId
    };

    const deleteResult = await deleteTodo(input);

    expect(deleteResult.success).toBe(true);

    // Verify todo was deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should reorder remaining todos after deletion', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', order_index: 0 },
        { title: 'Todo 2', description: 'Second todo', order_index: 1 },
        { title: 'Todo 3', description: 'Third todo', order_index: 2 },
        { title: 'Todo 4', description: 'Fourth todo', order_index: 3 }
      ])
      .execute();

    // Get all todos to find the middle one to delete
    const allTodos = await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();

    // Delete the second todo (index 1)
    const todoToDelete = allTodos.find(t => t.order_index === 1);
    expect(todoToDelete).toBeDefined();

    const input: DeleteTodoInput = {
      id: todoToDelete!.id
    };

    await deleteTodo(input);

    // Verify remaining todos are properly reordered
    const remainingTodos = await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();

    expect(remainingTodos).toHaveLength(3);
    expect(remainingTodos[0].order_index).toBe(0);
    expect(remainingTodos[1].order_index).toBe(1); // Was originally index 2
    expect(remainingTodos[2].order_index).toBe(2); // Was originally index 3
    expect(remainingTodos[0].title).toBe('Todo 1');
    expect(remainingTodos[1].title).toBe('Todo 3');
    expect(remainingTodos[2].title).toBe('Todo 4');
  });

  it('should handle deletion of first todo', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', order_index: 0 },
        { title: 'Todo 2', description: 'Second todo', order_index: 1 },
        { title: 'Todo 3', description: 'Third todo', order_index: 2 }
      ])
      .execute();

    // Get first todo
    const firstTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.order_index, 0))
      .execute();

    const input: DeleteTodoInput = {
      id: firstTodo[0].id
    };

    await deleteTodo(input);

    // Verify remaining todos are properly reordered
    const remainingTodos = await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos[0].order_index).toBe(0);
    expect(remainingTodos[1].order_index).toBe(1);
    expect(remainingTodos[0].title).toBe('Todo 2');
    expect(remainingTodos[1].title).toBe('Todo 3');
  });

  it('should handle deletion of last todo', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', order_index: 0 },
        { title: 'Todo 2', description: 'Second todo', order_index: 1 },
        { title: 'Todo 3', description: 'Third todo', order_index: 2 }
      ])
      .execute();

    // Get last todo
    const lastTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.order_index, 2))
      .execute();

    const input: DeleteTodoInput = {
      id: lastTodo[0].id
    };

    await deleteTodo(input);

    // Verify remaining todos maintain their order
    const remainingTodos = await db.select()
      .from(todosTable)
      .orderBy(asc(todosTable.order_index))
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos[0].order_index).toBe(0);
    expect(remainingTodos[1].order_index).toBe(1);
    expect(remainingTodos[0].title).toBe('Todo 1');
    expect(remainingTodos[1].title).toBe('Todo 2');
  });

  it('should throw error when todo not found', async () => {
    const input: DeleteTodoInput = {
      id: 999 // Non-existent ID
    };

    await expect(deleteTodo(input)).rejects.toThrow(/todo not found/i);
  });
});
