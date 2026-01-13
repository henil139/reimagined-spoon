import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  Table,
  Tag,
  Modal,
  Select,
  message,
  Divider,
} from "antd";
import {
  useProjectWithMembers,
  useAddProjectMember,
  useRemoveProjectMember,
  useAllUsers,
} from "../../hooks/useProjects.js";
import { useTasks } from "../../hooks/useTasks.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import TaskModal from "../../components/tasks/TaskModal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import dayjs from "dayjs";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: project, isLoading: projectLoading } =
    useProjectWithMembers(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);
  const { data: allUsers } = useAllUsers();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Remove member confirmation
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const isAdmin = role === "admin";

  // Add member to project
  const handleAddMember = async () => {
    if (!selectedUserId || !id) return;
    try {
      await addMember.mutateAsync({ projectId: id, userId: selectedUserId });
      message.success("Member added");
      setMemberModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      message.error(error.message);
    }
  };

  // Open remove confirmation
  const handleRemoveClick = (member) => {
    setMemberToRemove(member);
    setRemoveConfirmOpen(true);
  };

  // Confirm remove member
  const handleConfirmRemove = async () => {
    if (!memberToRemove || !id) return;
    try {
      await removeMember.mutateAsync({
        projectId: id,
        userId: memberToRemove.id,
      });
      message.success("Member removed");
      setRemoveConfirmOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      message.error(error.message);
    }
  };

  // Get users not already in project
  const existingMemberIds = project?.members?.map((m) => m.user_id) || [];
  const availableUsers =
    allUsers?.filter((u) => !existingMemberIds.includes(u.id)) || [];

  // Task table columns
  const taskColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <a onClick={() => navigate(`/dashboard/tasks/${record.id}`)}>{title}</a>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Tag
          color={
            priority === "high"
              ? "red"
              : priority === "medium"
              ? "orange"
              : "green"
          }
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Assignee",
      key: "assignee",
      render: (_, record) =>
        record.assigned_user?.username || record.assigned_user?.email || "-",
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
  ];

  if (projectLoading || tasksLoading) return <Spin />;
  if (!project) return <Card>Project not found</Card>;

  return (
    <div>
      <Button
        onClick={() => navigate("/dashboard/projects")}
        style={{ marginBottom: 16 }}
      >
        ← Back
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <h2>{project.title}</h2>
        <p>{project.description || "No description"}</p>

        <Divider />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4>Team Members ({project.members?.length || 0})</h4>
          {isAdmin && (
            <Button type="primary" onClick={() => setMemberModalOpen(true)}>
              Add Member
            </Button>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          {project.members?.length === 0 ? (
            <span>
              No members yet.{" "}
              {isAdmin
                ? 'Click "Add Member" to add people to this project.'
                : ""}
            </span>
          ) : (
            project.members?.map((member) => (
              <Tag
                key={member.id}
                closable={isAdmin}
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveClick(member);
                }}
                style={{ marginBottom: 4 }}
              >
                {member.username || member.email || "Unknown"}
              </Tag>
            ))
          )}
        </div>
      </Card>

      <Card
        title="Tasks"
        extra={
          <Button type="primary" onClick={() => setTaskModalOpen(true)}>
            New Task
          </Button>
        }
      >
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          size="small"
        />
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Add Member to Project"
        open={memberModalOpen}
        onCancel={() => setMemberModalOpen(false)}
        onOk={handleAddMember}
        okText="Add Member"
        okButtonProps={{
          disabled: !selectedUserId,
          loading: addMember.isPending,
        }}
      >
        <p style={{ marginBottom: 16 }}>
          Select a user to add to this project. They will be able to see the
          project and its tasks.
        </p>
        <Select
          style={{ width: "100%" }}
          placeholder="Select user"
          value={selectedUserId}
          onChange={setSelectedUserId}
          options={availableUsers.map((u) => ({
            value: u.id,
            label: u.username || u.email,
          }))}
          showSearch
          filterOption={(input, option) =>
            option?.label?.toLowerCase().includes(input.toLowerCase())
          }
        />
        {availableUsers.length === 0 && (
          <p style={{ marginTop: 8, color: "#999" }}>
            No more users available to add.
          </p>
        )}
      </Modal>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        members={project.members}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={removeConfirmOpen}
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          setRemoveConfirmOpen(false);
          setMemberToRemove(null);
        }}
        title="Remove Member"
        description={`Are you sure you want to remove ${
          memberToRemove?.username || memberToRemove?.email || "this user"
        } from the project? They will no longer be able to see this project or its tasks.`}
        confirmText="Remove Member"
        danger
        loading={removeMember.isPending}
      />
    </div>
  );
}
