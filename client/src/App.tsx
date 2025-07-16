
import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { TodoList } from '@/components/TodoList';
import { TodoForm } from '@/components/TodoForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckSquare } from 'lucide-react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (input: CreateTodoInput) => {
    setIsFormLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(input);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, title: string, description: string) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({ id, title, description });
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleReorderTodos = async (todoId: number, newOrderIndex: number) => {
    try {
      // Optimistically update the UI
      setTodos((prev: Todo[]) => {
        const todoToMove = prev.find((todo: Todo) => todo.id === todoId);
        if (!todoToMove) return prev;
        
        const otherTodos = prev.filter((todo: Todo) => todo.id !== todoId);
        const newTodos = [...otherTodos];
        newTodos.splice(newOrderIndex, 0, { ...todoToMove, order_index: newOrderIndex });
        
        // Update order indices for all todos
        return newTodos.map((todo: Todo, index: number) => ({
          ...todo,
          order_index: index
        }));
      });

      // Update on server
      const updatedTodos = await trpc.reorderTodos.mutate({ todoId, newOrderIndex });
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Failed to reorder todos:', error);
      // Reload todos on error to sync with server
      loadTodos();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">My Todo List</h1>
          </div>
          <p className="text-gray-600">Organize your tasks with drag-and-drop simplicity</p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700">Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoForm onSubmit={handleCreateTodo} isLoading={isFormLoading} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700">Your Tasks</CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks yet. Add your first task above! ✨</p>
              </div>
            ) : (
              <TodoList
                todos={todos}
                onDelete={handleDeleteTodo}
                onUpdate={handleUpdateTodo}
                onReorder={handleReorderTodos}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
