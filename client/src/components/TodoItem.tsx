
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Todo } from '../../../server/src/schema';

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
}

export function TodoItem({ todo, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(todo.id, editTitle, editDescription);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(todo.id);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <Input
          value={editTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
          className="text-base font-medium"
          placeholder="Task title"
        />
        <Textarea
          value={editDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
          rows={3}
          className="text-sm resize-none"
          placeholder="Task description"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={isUpdating || !editTitle.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            disabled={isUpdating}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 break-words">{todo.title}</h3>
          {todo.description && (
            <p className="text-sm text-gray-600 mt-1 break-words">{todo.description}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="text-xs text-gray-400">
        Created: {todo.created_at.toLocaleDateString()}
      </div>
    </div>
  );
}
