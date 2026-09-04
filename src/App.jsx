import React, { useState } from 'react';
import './App.css';
import BannerTab from './BannerTab';
import NukkiTab from './NukkiTab';

function App() {
  // 기본 상태를 'banner'로 설정하여 접속 시 바로 썸네일 제작이 보이도록 함
  const [activeTab, setActiveTab] = useState('banner');

  return (
    <div className="landing-container">
      {/* 헤더 및 탭 메뉴 */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">SJN 배너지옥 탈출모임</div>
        
        {/* 헤더 우측 탭 선택 메뉴 */}
        <div className="tab-menu" style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('banner')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'banner' ? '#0070f3' : '#333',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            🖼️ 썸네일 제작
          </button>
          <button
            onClick={() => setActiveTab('nukki')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'nukki' ? '#0070f3' : '#333',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            ✂️ 누끼 따기
          </button>
        </div>
      </header>

      {/* 탭 상태에 따른 화면 전환 (새로고침 없이 빠른 전환) */}
      {activeTab === 'banner' && <BannerTab />}
      {activeTab === 'nukki' && <NukkiTab />}
    </div>
  );
}

export default App;