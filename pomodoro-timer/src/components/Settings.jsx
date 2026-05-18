import React from 'react';

function Settings({ settings, onUpdate }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="panel settings">
      <h3>设置</h3>

      <div className="setting-item">
        <label>工作时长（分钟）</label>
        <input
          type="number"
          min="1"
          max="60"
          value={settings.workTime}
          onChange={(e) => handleChange('workTime', parseInt(e.target.value) || 25)}
          className="input"
        />
      </div>

      <div className="setting-item">
        <label>短休息时长（分钟）</label>
        <input
          type="number"
          min="1"
          max="30"
          value={settings.shortBreakTime}
          onChange={(e) => handleChange('shortBreakTime', parseInt(e.target.value) || 5)}
          className="input"
        />
      </div>

      <div className="setting-item">
        <label>长休息时长（分钟）</label>
        <input
          type="number"
          min="1"
          max="60"
          value={settings.longBreakTime}
          onChange={(e) => handleChange('longBreakTime', parseInt(e.target.value) || 15)}
          className="input"
        />
      </div>

      <div className="setting-item toggle">
        <label>自动开始休息</label>
        <button
          className={`toggle-btn ${settings.autoStartBreak ? 'active' : ''}`}
          onClick={() => handleChange('autoStartBreak', !settings.autoStartBreak)}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      <div className="setting-item toggle">
        <label>自动开始工作</label>
        <button
          className={`toggle-btn ${settings.autoStartWork ? 'active' : ''}`}
          onClick={() => handleChange('autoStartWork', !settings.autoStartWork)}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      <div className="setting-item toggle">
        <label>提示音</label>
        <button
          className={`toggle-btn ${settings.soundEnabled ? 'active' : ''}`}
          onClick={() => handleChange('soundEnabled', !settings.soundEnabled)}
        >
          <span className="toggle-slider" />
        </button>
      </div>
    </div>
  );
}

export default Settings;
