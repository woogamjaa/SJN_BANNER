import React, { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

function NukkiTab() {
  const [imageSrc, setImageSrc] = useState(null);
  const [resultSrc, setResultSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  // 1. AI 검사용 임시 이미지 (명암 조절)
  const createInspectionBlob = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.filter = 'contrast(140%) brightness(100%)';
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
    });
  };

  // 2. AI 마스크 기반 투명 PNG 생성
  const applyMaskToOriginal = (originalFile, aiMaskBlob) => {
    return new Promise((resolve) => {
      const origImg = new Image();
      const maskImg = new Image();

      const origUrl = URL.createObjectURL(originalFile);
      const maskUrl = URL.createObjectURL(aiMaskBlob);

      origImg.src = origUrl;
      origImg.onload = () => {
        maskImg.src = maskUrl;
        maskImg.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = origImg.width;
          canvas.height = origImg.height;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(maskImg, 0, 0);

          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(origImg, 0, 0);

          URL.revokeObjectURL(origUrl);
          URL.revokeObjectURL(maskUrl);

          canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/png');
        };
      };
    });
  };

  const processNukki = async (file) => {
    setImageSrc(URL.createObjectURL(file));
    setResultSrc(null);
    setLoading(true);
    setProgress('AI 분석 준비 중...');

    try {
      const inspectBlob = await createInspectionBlob(file);

      const maskBlob = await removeBackground(inspectBlob, {
        progress: (key, current, total) => {
          if (total) {
            const percent = Math.round((current / total) * 100);
            setProgress(`배경 분석 중... (${percent}%)`);
          } else {
            setProgress('마스크 처리 중...');
          }
        }
      });

      const finalOriginalResultUrl = await applyMaskToOriginal(file, maskBlob);
      setResultSrc(finalOriginalResultUrl);
    } catch (error) {
      console.error('누끼 제거 실패:', error);
      alert('누끼 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) processNukki(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '100px auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 💡 상단 설명 영역 */}
      <div style={{ backgroundColor: '#ffced7', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2rem', textAlign: 'center', width: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#222', marginBottom: '0.5rem' }}>✂️ AI 자동 누끼 따기</h2>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.5' }}>
            이미지를 업로드하면 자동으로 누끼본을 제공해 드립니다!
            <br />
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              * 연출컷이나 배경이 복잡한 경우 누끼가 올바르게 작동하지 않을 수 있습니다.
            </span>
          </p>

          <div style={{ marginTop: '1.5rem' }}>
            <label className="file-upload-btn" style={{ cursor: 'pointer', padding: '12px 24px', fontSize: '1rem', display: 'inline-block' }}>
              원본 이미지 선택
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
          </div>
        </div>
      </div>

      {/* 💡 로딩 영역 */}
      {loading && (
        <div style={{ backgroundColor: '#ffced7', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '1.5rem', textAlign: 'center', width: '100%' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>🤖 AI가 배경을 지우는 중입니다...</p>
            <p style={{ color: '#ff5e7e', fontSize: '0.9rem', marginTop: '6px', fontWeight: '600' }}>{progress}</p>
          </div>
        </div>
      )}

      {/* 💡 결과물 출력 영역 */}
      {(imageSrc || resultSrc) && (
        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', flexWrap: 'wrap' }}>
          
          {/* 원본 카드 */}
          {imageSrc && (
            <div style={{ backgroundColor: '#ffced7', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flex: '1', minWidth: '280px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2rem', textAlign: 'center', width: '100%' }}>
                <h4 style={{ marginBottom: '1rem', color: '#333' }}>원본 이미지</h4>
                <div style={{ background: '#f4f4f4', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'center' }}>
                  <img src={imageSrc} alt="원본" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          )}

          {/* 누끼 결과물 카드 */}
          {resultSrc && (
            <div style={{ backgroundColor: '#ffced7', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flex: '1', minWidth: '280px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2rem', textAlign: 'center', width: '100%' }}>
                <h4 style={{ marginBottom: '1rem', color: '#333' }}>누끼 결과물 (투명 PNG)</h4>
                <div style={{ 
                  backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  padding: '10px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <img src={resultSrc} alt="누끼 결과" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                </div>
                <a href={resultSrc} download="nukki_result.png" style={{ width: '100%', display: 'block' }}>
                  <button className="dl-btn" style={{ marginTop: '1rem', width: '100%' }}>
                    PNG 다운로드
                  </button>
                </a>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default NukkiTab;