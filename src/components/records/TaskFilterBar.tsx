"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TaskDefinition } from '@/types';
import { ListFilter, ChevronUp, ChevronDown } from 'lucide-react';

interface TaskFilterBarProps {
  taskDefinitions: TaskDefinition[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

const TaskFilterBar: React.FC<TaskFilterBarProps> = ({ taskDefinitions, selectedTaskId, onSelectTask }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 p-3 rounded-lg shadow-md bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <ListFilter className="h-4 w-4 mr-2 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Filter by Task</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="h-7 w-7">
          <span className="sr-only">{isOpen ? "Hide filters" : "Show filters"}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant={selectedTaskId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectTask(null)}
          >
            All Tasks
          </Button>
          {taskDefinitions.map((task) => (
            <Button
              key={task.id}
              variant={selectedTaskId === task.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectTask(task.id)}
              style={
                selectedTaskId === task.id
                  ? {
                      backgroundColor: task.color,
                      borderColor: task.color,
                      color: 'hsl(var(--foreground))',
                    }
                  : {}
              }
            >
              {task.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilterBar;