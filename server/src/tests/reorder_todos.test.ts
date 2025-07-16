
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ReorderTodosInput } from '../schema';
import { reorderTodos } from '../handlers/reorder_todos';

describe('reorderTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test todos
  const createTestTodos = async () => {
    const todos = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', order_index: 0 },
        { title: 'Todo 2', description: 'Second todo', order_index: 1 },
        { title: 'Todo 3', description: 'Third todo', order_index: 2 },
        { title: 'Todo 4', description: 'Fourth todo', order_index: 3 }
      ])
      .returning()
      .execute();
    
    return todos;
  };

  it('should move todo down in the list', async () => {
    const todos = await createTestTodos();
    
    // Move first todo (index 0) to position 2
    const input: ReorderTodosInput = {
      todoId: todos[0].id,
      newOrderIndex: 2
    };

    const result = await reorderTodos(input);

    expect(result).toHaveLength(4);
    
    // Check the order is correct
    expect(result[0].title).toBe('Todo 2');
    expect(result[0].order_index).toBe(0);
    expect(result[1].title).toBe('Todo 3');
    expect(result[1].order_index).toBe(1);
    expect(result[2].title).toBe('Todo 1'); // Moved item
    expect(result[2].order_index).toBe(2);
    expect(result[3].title).toBe('Todo 4');
    expect(result[3].order_index).toBe(3);
  });

  it('should move todo up in the list', async () => {
    const todos = await createTestTodos();
    
    // Move third todo (index 2) to position 0
    const input: ReorderTodosInput = {
      todoId: todos[2].id,
      newOrderIndex: 0
    };

    const result = await reorderTodos(input);

    expect(result).toHaveLength(4);
    
    // Check the order is correct
    expect(result[0].title).toBe('Todo 3'); // Moved item
    expect(result[0].order_index).toBe(0);
    expect(result[1].title).toBe('Todo 1');
    expect(result[1].order_index).toBe(1);
    expect(result[2].title).toBe('Todo 2');
    expect(result[2].order_index).toBe(2);
    expect(result[3].title).toBe('Todo 4');
    expect(result[3].order_index).toBe(3);
  });

  it('should handle no change when moving to same position', async () => {
    const todos = await createTestTodos();
    
    // Move todo to its current position
    const input: ReorderTodosInput = {
      todoId: todos[1].id,
      newOrderIndex: 1
    };

    const result = await reorderTodos(input);

    expect(result).toHaveLength(4);
    
    // Order should remain unchanged
    expect(result[0].title).toBe('Todo 1');
    expect(result[0].order_index).toBe(0);
    expect(result[1].title).toBe('Todo 2');
    expect(result[1].order_index).toBe(1);
    expect(result[2].title).toBe('Todo 3');
    expect(result[2].order_index).toBe(2);
    expect(result[3].title).toBe('Todo 4');
    expect(result[3].order_index).toBe(3);
  });

  it('should move todo to last position', async () => {
    const todos = await createTestTodos();
    
    // Move first todo to last position
    const input: ReorderTodosInput = {
      todoId: todos[0].id,
      newOrderIndex: 3
    };

    const result = await reorderTodos(input);

    expect(result).toHaveLength(4);
    
    // Check the order is correct
    expect(result[0].title).toBe('Todo 2');
    expect(result[0].order_index).toBe(0);
    expect(result[1].title).toBe('Todo 3');
    expect(result[1].order_index).toBe(1);
    expect(result[2].title).toBe('Todo 4');
    expect(result[2].order_index).toBe(2);
    expect(result[3].title).toBe('Todo 1'); // Moved item
    expect(result[3].order_index).toBe(3);
  });

  it('should throw error for non-existent todo', async () => {
    await createTestTodos();
    
    const input: ReorderTodosInput = {
      todoId: 999,
      newOrderIndex: 0
    };

    expect(reorderTodos(input)).rejects.toThrow(/todo not found/i);
  });

  it('should update timestamps correctly', async () => {
    const todos = await createTestTodos();
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input: ReorderTodosInput = {
      todoId: todos[0].id,
      newOrderIndex: 2
    };

    const result = await reorderTodos(input);

    // Find the moved todo and check its updated_at timestamp
    const movedTodo = result.find(todo => todo.id === todos[0].id);
    expect(movedTodo).toBeDefined();
    expect(movedTodo!.updated_at).toBeInstanceOf(Date);
    expect(movedTodo!.updated_at.getTime()).toBeGreaterThan(movedTodo!.created_at.getTime());
  });
});
