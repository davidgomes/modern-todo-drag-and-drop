
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo item for testing'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual(testInput.description);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual(testInput.description);
    expect(todos[0].order_index).toEqual(0);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should assign correct order_index when no todos exist', async () => {
    const result = await createTodo(testInput);
    expect(result.order_index).toEqual(0);
  });

  it('should assign incremental order_index when todos exist', async () => {
    // Create first todo
    const firstTodo = await createTodo({
      title: 'First Todo',
      description: 'First todo description'
    });
    expect(firstTodo.order_index).toEqual(0);

    // Create second todo
    const secondTodo = await createTodo({
      title: 'Second Todo',
      description: 'Second todo description'
    });
    expect(secondTodo.order_index).toEqual(1);

    // Create third todo
    const thirdTodo = await createTodo({
      title: 'Third Todo',
      description: 'Third todo description'
    });
    expect(thirdTodo.order_index).toEqual(2);
  });

  it('should handle todos with existing order indices correctly', async () => {
    // Insert a todo with a specific order_index directly
    await db.insert(todosTable)
      .values({
        title: 'Existing Todo',
        description: 'Existing description',
        order_index: 5
      })
      .execute();

    // Create new todo - should get order_index 6
    const result = await createTodo(testInput);
    expect(result.order_index).toEqual(6);
  });
});
