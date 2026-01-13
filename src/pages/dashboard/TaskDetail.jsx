import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Tag, Divider, Input, List, message, Popconfirm } from 'antd';
import { useTask, useUpdateTask } from '../../hooks/useTasks.js';
import { useComments, useCreateComment, useDeleteComment } from '../../hooks/useComments.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import TaskModal from '../../components/tasks/TaskModal.jsx';
import TaskActivityLog from '../../components/tasks/TaskActivityLog.jsx';
import dayjs from 'dayjs';

const STATUS_TRANSITIONS = {
  to_do: ['in_progress'],
  in_progress: ['to_do', 'under_review'],
  under_review: ['in_progress', 'completed'],
  completed: ['under_review'],
};

export default function TaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const { data: task, isLoading } = useTask(projectId, taskId);
  const updateTask = useUpdateTask(projectId);

  const { data: comments } = useComments(taskId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  if (isLoading) return <Spin />;
  if (!task) return <Card>Task not found</Card>;

  const allowedStatuses = STATUS_TRANSITIONS[task.status] || [];

  const handleStatusChange = async (status) => {
    if (!allowedStatuses.includes(status)) {
      message.error('Invalid status transition');
      return;
    }
    await updateTask.mutateAsync({ id: task.id, status });
    message.success('Status updated');
  };

  return (
    <div>
      <Button onClick={() => navigate(-1)}>← Back</Button>

      <Card style={{ marginTop: 16 }}>
        <Tag>{task.priority}</Tag>
        <Tag>{task.status}</Tag>

        <h2>{task.title}</h2>
        <p>{task.description}</p>

        <Divider />

        <p><strong>Project:</strong> {task.project?.title}</p>
        <p><strong>Assignee:</strong> {task.assigned_user?.username || '-'}</p>
        <p><strong>Due:</strong> {task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : '-'}</p>

        <Divider />

        {allowedStatuses.map(s => (
          <Button key={s} onClick={() => handleStatusChange(s)}>
            Move to {s}
          </Button>
        ))}
      </Card>

      <TaskActivityLog taskId={taskId} />

      <Card title="Comments" style={{ marginTop: 16 }}>
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button
          type="primary"
          onClick={() => createComment.mutate({ taskId, content: newComment })}
        >
          Add Comment
        </Button>

        <List
          dataSource={comments}
          renderItem={c => (
            <List.Item
              actions={
                c.user_id === user.id || role === 'admin'
                  ? [
                      <Popconfirm
                        title="Delete?"
                        onConfirm={() => deleteComment.mutate({ id: c.id, taskId })}
                      >
                        <Button danger size="small">Delete</Button>
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                title={`${c.user?.username} • ${dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}`}
                description={c.content}
              />
            </List.Item>
          )}
        />
      </Card>

      <TaskModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        task={task}
      />
    </div>
  );
}
