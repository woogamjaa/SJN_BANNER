import React, { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

function NukkiTab() {
  const [imageSrc, setImageSrc] = useState(null);
  const [resultSrc, setResultSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  // AI 민감도 조절용 임시 파라미터 (기본 100%)
  const [contrastVal, setContrastVal] = useState(130);

  // 1. AI 인식을 위해 대비만 변경한 '검사용 Blob' 생성
  const createInspectionBlob = (file, contrast) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        // 경계선 감지를 위한 대비/밝기 필터 적용
        ctx.filter = `contrast(${contrast}%) brightness(95%)`;
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
    });
  };

  // 2. AI가 뽑아낸 누끼 마스크를 '원본 이미지'에 합성하여 순수 원본 색상 복원
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

          // ① AI 결과물(마스크)을 먼저 그림
          ctx.drawImage(maskImg, 0, 0);

          // ② Alpha Mask 알파 연산 설정: 기존 알파 영역에 원본 이미지만 덮어씌움
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
      // Step A: 검사 전용 보정 이미지 생성
      const inspectBlob = await createInspectionBlob(file, contrastVal);

      // Step B: AI 배경 제거 진행 (마스크 추출)
      const maskBlob = await removeBackground(inspectBlob, {
        progress: (key, current, total) => {
          if (total) {
            const percent = Math.round((current / total) * 100);
            setProgress(`배경 감지 중... (${percent}%)`);
          } else {
            setProgress('마스크 추출 중...');
          }
        }
      });

      // Step C: AI 마스크 영역을 '원본 파일'에 마스킹하여 원본 색상 추출
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px', color: '#6b6767' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>✂️ AI 자동 누끼 따기</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          서버 전송 없이 브라우저에서 배경을 제거합니다. (결과물은 원본 색상 그대로 유지됩니다.)
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label className="file-upload-btn" style={{ cursor: 'pointer', padding: '12px 24px', fontSize: '1rem' }}>
          원본 이미지 선택
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', background: '#1e1e1e', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>🤖 AI가 배경을 지우는 중입니다...</p>
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>{progress}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {imageSrc && (
          <div style={{ flex: '1', minWidth: '280px', background: '#1e1e1e', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px', color: '#fff' }}>원본 이미지</h4>
            <img src={imageSrc} alt="원본" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '6px' }} />
          </div>
        )}

        {resultSrc && (
          <div style={{ flex: '1', minWidth: '280px', background: '#1e1e1e', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px', color: '#fff' }}>누끼 결과물 (순수 원본)</h4>
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
                📥 원본 색상 PNG 다운로드
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default NukkiTab;