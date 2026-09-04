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

  // 2. AI 마스크 기반 투명 PNG 생성 (검은 배경 완전 제거)
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

          // 💡 핵심: 캔버스 전체 투명으로 완전 초기화
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // ① AI 마스크 이미지 그리기
          ctx.drawImage(maskImg, 0, 0);

          // ② 마스크의 알파 영역(형태)에만 원본 이미지를 채움
          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(origImg, 0, 0);

          URL.revokeObjectURL(origUrl);
          URL.revokeObjectURL(maskUrl);

          // 투명 채널 유지 PNG 변환
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px', color: '#6b6767' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>✂️ AI 자동 누끼 따기</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          이미지를 업로드 시키면 자동으로 누끼본을 제공드립니다!
          <br>
          연출컷, 배경이 복잡한 경우 누끼가 올바르게 작동하지 않습니다.
          </br>
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
            <h4 style={{ marginBottom: '10px', color: '#fff' }}>누끼 결과물 (투명 PNG)</h4>
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
                PNG 다운로드
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default NukkiTab;