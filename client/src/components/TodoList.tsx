
import { useState } from 'react';
import { TodoItem } from './TodoItem';
import { GripVertical } from 'lucide-react';
import type { Todo } from '../../../server/src/schema';

interface TodoListProps {
  todos: Todo[];
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
  onReorder: (todoId: number, newOrderIndex: number) => Promise<void>;
}

export function TodoList({ todos, onDelete, onUpdate, onReorder }: TodoListProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sortedTodos = [...todos].sort((a: Todo, b: Todo) => a.order_index - b.order_index);

  const handleDragStart = (e: React.DragEvent, todoId: number) => {
    setDraggedItem(todoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedItem === null) return;
    
    const draggedTodo = sortedTodos.find((todo: Todo) => todo.id === draggedItem);
    if (!draggedTodo) return;
    
    const currentIndex = sortedTodos.findIndex((todo: Todo) => todo.id === draggedItem);
    if (currentIndex === dropIndex) return;
    
    await onReorder(draggedItem, dropIndex);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {sortedTodos.map((todo: Todo, index: number) => (
        <div
          key={todo.id}
          className={`group relative ${
            dragOverIndex === index ? 'border-t-2 border-blue-400' : ''
          }`}
          onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e: React.DragEvent) => handleDrop(e, index)}
        >
          <div
            className={`flex items-start gap-3 p-4 bg-white rounded-lg border transition-all duration-200 ${
              draggedItem === todo.id 
                ? 'opacity-50 border-blue-300 shadow-lg' 
                : 'hover:shadow-md border-gray-200'
            }`}
            draggable
            onDragStart={(e: React.DragEvent) => handleDragStart(e, todo.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-shrink-0 pt-1">
              <GripVertical 
                className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <TodoItem
                todo={todo}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
