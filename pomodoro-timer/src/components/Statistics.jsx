import React from 'react';
import { FiTarget, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';

function Statistics({ stats }) {
  return (
    <div className="panel statistics">
      <h3>统计信息</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <FiTarget className="stat-icon" />
          <div className="stat-value">{stats.todayPomodoros}</div>
          <div className="stat-label">今日番茄</div>
        </div>

        <div className="stat-card">
          <FiCalendar className="stat-icon" />
          <div className="stat-value">{stats.totalPomodoros}</div>
          <div className="stat-label">总计番茄</div>
        </div>

        <div className="stat-card">
          <FiClock className="stat-icon" />
          <div className="stat-value">{stats.totalMinutes}</div>
          <div className="stat-label">专注分钟</div>
        </div>

        <div className="stat-card">
          <FiTrendingUp className="stat-icon" />
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">连续天数</div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
