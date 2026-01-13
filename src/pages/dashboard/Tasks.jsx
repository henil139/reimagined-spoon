import { useState } from 'react';
import { Card, Table, Button, Tag, Select, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTasks, useDeleteTask } from '../../hooks/useTasks.js';
import { useProjects } from '../../hooks/useProjects.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import TaskModal from '../../components/tasks/TaskModal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import dayjs from 'dayjs';

export default function Tasks() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: projects } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { data: tasks, isLoading } = useTasks(selectedProjectId);
  const deleteTask = useDeleteTask(selectedProjectId);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const isAdmin = role === 'admin';

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTask.mutateAsync(taskToDelete.id);
      message.success('Task deleted');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (title, record) => (
        <a onClick={() =>
          navigate(`/dashboard/projects/${record.project_id}/tasks/${record.id}`)
        }>
          {title}
        </a>
      ),
    },
    {
      title: 'Project',
      render: (_, record) => record.project?.title || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <Tag>{status?.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (priority) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Assignee',
      render: (_, record) =>
        record.assigned_user?.username || record.assigned_user?.email || '-',
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
  ];

  if (isAdmin) {
    columns.push({
      title: '',
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDeleteClick(record)}>
          Delete
        </Button>
      ),
    });
  }

  if (!selectedProjectId) {
    return (
      <Card>
        <Select
          placeholder="Select Project"
          style={{ width: 300 }}
          onChange={setSelectedProjectId}
        >
          {projects?.map(p => (
            <Select.Option key={p.id} value={p.id}>
              {p.title}
            </Select.Option>
          ))}
        </Select>
      </Card>
    );
  }

  if (isLoading) return <Spin />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Tasks</h2>
        <Button type="primary" onClick={() => setTaskModalOpen(true)}>
          New Task
        </Button>
      </div>

      <Card>
        <Table dataSource={tasks} columns={columns} rowKey="id" />
      </Card>

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        title="Delete Task"
        description={`Delete "${taskToDelete?.title}"?`}
        danger
      />
    </div>
  );
}
