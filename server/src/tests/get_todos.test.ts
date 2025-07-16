
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos ordered by order_index', async () => {
    // Create test todos with different order indices
    await db.insert(todosTable).values([
      {
        title: 'Third Todo',
        description: 'This should be third',
        order_index: 2
      },
      {
        title: 'First Todo',
        description: 'This should be first',
        order_index: 0
      },
      {
        title: 'Second Todo',
        description: 'This should be second',
        order_index: 1
      }
    ]).execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Todo');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].title).toEqual('Second Todo');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].title).toEqual('Third Todo');
    expect(result[2].order_index).toEqual(2);
  });

  it('should return todos with all required fields', async () => {
    await db.insert(todosTable).values({
      title: 'Test Todo',
      description: 'Test Description',
      order_index: 0
    }).execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];
    expect(todo.id).toBeDefined();
    expect(todo.title).toEqual('Test Todo');
    expect(todo.description).toEqual('Test Description');
    expect(todo.order_index).toEqual(0);
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple todos with same order_index', async () => {
    // Insert todos with same order_index to test sorting behavior
    await db.insert(todosTable).values([
      {
        title: 'Todo A',
        description: 'First todo with order 1',
        order_index: 1
      },
      {
        title: 'Todo B',
        description: 'Second todo with order 1',
        order_index: 1
      },
      {
        title: 'Todo C',
        description: 'Todo with order 0',
        order_index: 0
      }
    ]).execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    // First todo should have order_index 0
    expect(result[0].order_index).toEqual(0);
    expect(result[0].title).toEqual('Todo C');
    // Next two should have order_index 1
    expect(result[1].order_index).toEqual(1);
    expect(result[2].order_index).toEqual(1);
  });
});
