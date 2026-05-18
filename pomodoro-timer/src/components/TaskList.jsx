/**
 * TaskList 组件 - 任务列表管理
 *
 * 功能：
 * 1. 显示所有任务列表
 * 2. 添加新任务
 * 3. 切换任务完成状态
 * 4. 删除任务
 * 5. 显示每个任务关联的番茄数量
 */

import React, { useState } from 'react';
import { FiPlus, FiCheck, FiTrash2, FiCircle } from 'react-icons/fi';

/**
 * TaskList 组件
 * @param {Array} tasks - 任务数组，每个任务包含 { id, text, completed, pomodoros }
 * @param {Function} onAdd - 添加任务的回调函数
 * @param {Function} onToggle - 切换任务完成状态的回调函数
 * @param {Function} onDelete - 删除任务的回调函数
 */
function TaskList({ tasks, onAdd, onToggle, onDelete }) {
  // 使用 useState 管理新任务输入框的内容
  const [newTask, setNewTask] = useState('');

  /**
   * 处理表单提交
   * - 阻止默认表单提交行为
   * - 验证输入不为空（去除首尾空格）
   * - 调用 onAdd 回调添加任务
   * - 清空输入框
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止表单默认提交行为（页面刷新）
    if (newTask.trim()) { // trim() 去除首尾空格，确保不添加空白任务
      onAdd(newTask.trim()); // 调用父组件传入的添加任务函数
      setNewTask(''); // 清空输入框
    }
  };

  return (
    <div className="panel task-list">
      {/* 标题 */}
      <h3>任务列表</h3>

      {/* 添加任务的表单 */}
      <form className="task-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTask} // 受控组件：输入框的值由 state 控制
          onChange={(e) => setNewTask(e.target.value)} // 输入变化时更新 state
          placeholder="添加新任务..."
          className="input"
        />
        {/* 提交按钮，当输入为空时禁用 */}
        <button type="submit" className="icon-btn" disabled={!newTask.trim()}>
          <FiPlus /> {/* 加号图标 */}
        </button>
      </form>

      {/* 任务列表容器 */}
      <div className="tasks">
        {tasks.length === 0 ? (
          // 空列表提示
          <p className="empty-hint">暂无任务，添加一个开始吧</p>
        ) : (
          // 遍历渲染每个任务
          tasks.map((task) => (
            <div
              key={task.id} // React 需要唯一的 key 来优化列表渲染
              className={`task-item ${task.completed ? 'completed' : ''}`} // 根据完成状态添加样式类
            >
              {/* 完成状态切换按钮 */}
              <button className="task-check" onClick={() => onToggle(task.id)}>
                {/* 根据完成状态显示不同图标：已完成显示勾号，未完成显示空心圆 */}
                {task.completed ? <FiCheck /> : <FiCircle />}
              </button>

              {/* 任务文本 */}
              <span className="task-text">{task.text}</span>

              {/* 关联的番茄数量标签 */}
              <span className="task-pomodoros">{task.pomodoros}</span>

              {/* 删除按钮 */}
              <button className="task-delete" onClick={() => onDelete(task.id)}>
                <FiTrash2 /> {/* 垃圾桶图标 */}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;
