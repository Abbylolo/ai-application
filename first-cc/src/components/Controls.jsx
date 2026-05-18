import React from 'react';
import { FiPlay, FiPause, FiRotateCcw, FiSkipForward } from 'react-icons/fi';

function Controls({ isRunning, onToggle, onReset, onSkip }) {
  return (
    <div className="controls">
      <button className="control-btn secondary" onClick={onReset} title="重置">
        <FiRotateCcw />
      </button>
      <button className="control-btn primary" onClick={onToggle} title={isRunning ? '暂停' : '开始'}>
        {isRunning ? <FiPause /> : <FiPlay />}
      </button>
      <button className="control-btn secondary" onClick={onSkip} title="跳过">
        <FiSkipForward />
      </button>
    </div>
  );
}

export default Controls;
