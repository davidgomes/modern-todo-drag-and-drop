
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import type { CreateTodoInput } from '../../../server/src/schema';

interface TodoFormProps {
  onSubmit: (input: CreateTodoInput) => Promise<void>;
  isLoading?: boolean;
}

export function TodoForm({ onSubmit, isLoading = false }: TodoFormProps) {
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    await onSubmit(formData);
    setFormData({ title: '', description: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Task title *"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
          }
          required
          className="text-base"
        />
      </div>
      <div>
        <Textarea
          placeholder="Task description (optional)"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateTodoInput) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          className="text-base resize-none"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !formData.title.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating...
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Task
          </>
        )}
      </Button>
    </form>
  );
}
