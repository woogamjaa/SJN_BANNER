import React, { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

function NukkiTab() {
  const [imageSrc, setImageSrc] = useState(null);
  const [resultSrc, setResultSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageSrc(URL.createObjectURL(file));
    setResultSrc(null);
    setLoading(true);
    setProgress('AI 모델 준비 중...');

    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (total) {
            const percent = Math.round((current / total) * 100);
            setProgress(`${key.replace('fetch:', '')} 진행 중... (${percent}%)`);
          } else {
            setProgress('배경 제거 처리 중...');
          }
        }
      });

      const url = URL.createObjectURL(blob);
      setResultSrc(url);
    } catch (error) {
      console.error('누끼 제거 실패:', error);
      alert('누끼 제거 중 오류가 발생했습니다. 다른 이미지를 시도해 주세요.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px', color: '#6b6767' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2>✂️ AI 자동 누끼 따기</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          이미지를 업로드하면 서버 전송 없이 브라우저에서 배경을 투명하게 제거합니다.
          완벽하게 따진 못합니다ㅠ 천천히 기다려 주시고 급한 경우에만 사용해주세요.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <label className="file-upload-btn" style={{ cursor: 'pointer', padding: '12px 24px', fontSize: '1rem' }}>
          원본 이미지 선택
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', background: '#1e1e1e', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🤖 AI가 배경을 지우는 중입니다...</p>
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>{progress}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {imageSrc && (
          <div style={{ flex: '1', minWidth: '280px', background: '#1e1e1e', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px' }}>원본 이미지</h4>
            <img src={imageSrc} alt="원본" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '6px' }} />
          </div>
        )}

        {resultSrc && (
          <div style={{ flex: '1', minWidth: '280px', background: '#1e1e1e', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px' }}>누끼 결과물 (투명 PNG)</h4>
            <div style={{ 
              backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              padding: '10px',
              borderRadius: '6px',
              display: 'inline-block'
            }}>
              <img src={resultSrc} alt="누끼 결과" style={{ maxWidth: '100%', maxHeight: '350px' }} />
            </div>
            <br />
            <a href={resultSrc} download="nukki_result.png">
              <button className="dl-btn" style={{ marginTop: '15px', width: '100%' }}>
                📥 누끼본 PNG 다운로드
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default NukkiTab;