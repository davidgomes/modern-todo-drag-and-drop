
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title only', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original Description',
        order_index: 1
      })
      .returning()
      .execute();

    const input: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original Description'); // Should remain unchanged
    expect(result.order_index).toEqual(1); // Should remain unchanged
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should update todo description only', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original Description',
        order_index: 1
      })
      .returning()
      .execute();

    const input: UpdateTodoInput = {
      id: createdTodo.id,
      description: 'Updated Description'
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.description).toEqual('Updated Description');
    expect(result.order_index).toEqual(1); // Should remain unchanged
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should update both title and description', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original Description',
        order_index: 1
      })
      .returning()
      .execute();

    const input: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      description: 'Updated Description'
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated Description');
    expect(result.order_index).toEqual(1); // Should remain unchanged
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should save changes to database', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original Description',
        order_index: 1
      })
      .returning()
      .execute();

    const input: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      description: 'Updated Description'
    };

    await updateTodo(input);

    // Verify changes were saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Updated Description');
    expect(todos[0].updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    const input: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(input)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update updated_at timestamp even with no other changes', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original Description',
        order_index: 1
      })
      .returning()
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTodoInput = {
      id: createdTodo.id
      // No title or description provided
    };

    const result = await updateTodo(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });
});
