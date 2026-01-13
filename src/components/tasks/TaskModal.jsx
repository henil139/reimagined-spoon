import { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, message } from "antd";
import { useCreateTask, useUpdateTask } from "../../hooks/useTasks.js";
import { useProjectWithMembers } from "../../hooks/useProjects.js";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";

export default function TaskModal({ open, onClose, task, members }) {
  const { id } = useParams();
  const [form] = Form.useForm();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  // const { data: project } = useProjectWithMembers(projectId);
  const isEditing = !!task;
console.log("isdd",id);
  // Set form values when modal opens
  useEffect(() => {
    if (open) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,  
          assigned_to: task.assigned_to,
          due_date: task.due_date ? dayjs(task.due_date) : null,
        });
      } else {
        form.resetFields();
        form.setFieldValue("priority", "medium");
      }
    }
  }, [open, task, form]);

  // Handle form submit
  const handleSubmit = async (values) => {
    const formData = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      due_date: values.due_date
        ? dayjs(values.due_date).format("YYYY-MM-DD")
        : null,
      assigned_to: values.assigned_to || null,
    };

    try {
      if (isEditing) {
        await updateTask.mutateAsync({ id: task.id, ...formData });
        message.success("Task updated");
      } else {
        console.log("ihjgjgd",id);
        await createTask.mutateAsync({ project_id: parseInt(id), ...formData });
        message.success("Task created");
      }
      onClose();
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Task" : "New Task"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEditing ? "Update" : "Create"}
      confirmLoading={createTask.isPending || updateTask.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </Form.Item>
        <Form.Item name="assigned_to" label="Assignee">
          <Select
            placeholder="Select assignee"
            allowClear
            options={(members || []).map((m) => ({
              value: m.id,
              label: m.username || m.email,
            }))}
          />
        </Form.Item>

        <Form.Item name="due_date" label="Due Date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
