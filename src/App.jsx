import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const PLATFORM_PRESETS = [
  { id: 'common_naver', name: '공통 / 네이버', width: 1000, height: 1000 },
  { id: 'eleven_shooting', name: '11번가 슈팅배송', width: 600, height: 600 },
  { id: 'tdeal', name: 'T딜', width: 1000, height: 1000 },
  { id: 'wconcept', name: 'W컨셉 (세로형)', width: 960, height: 1280 },
  { id: 'kurly_vertical', name: '마켓컬리 (세로형)', width: 550, height: 708 },
  { id: 'samsung_welfare', name: '삼성복지몰', width: 720, height: 720 },
  { id: 'samsung_card', name: '삼성카드', width: 840, height: 840 },
  { id: 'wonbu_750', name: '원부 (750x750)', width: 750, height: 750 },
  { id: 'wonbu_1000', name: '원부 (1000x1000)', width: 1000, height: 1000 },
  { id: 'ezwel', name: '이지웰페어', width: 500, height: 500 },
  { id: 'kakao_store', name: '카카오스토어', width: 750, height: 750 },
  { id: 'kolon', name: '코오롱몰 (세로형)', width: 1500, height: 2250 },
  { id: 'coupang_direct', name: '쿠팡 직매입', width: 2000, height: 2000 },
  { id: 'queenit', name: '퀸잇', width: 1200, height: 1200 },
];

// 이미지 로드 헬퍼 함수
const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

function App() {
  const [firstOption, setFirstOption] = useState('공백');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORM_PRESETS[0]);
  const [imageSrc, setImageSrc] = useState(null);
  
  // 1. imageScale State 추가 (기본 75%)
  const [imageScale, setImageScale] = useState(75);

  const canvasRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    const renderCanvas = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { width, height } = selectedPlatform;

      // 1. 배경 채우기
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // 2. 비동기로 필요한 이미지 모두 준비
      const showMark = firstOption === '직영마크' || firstOption === '직영마크+로고';
      const showLogo = firstOption === '쿠쿠로고' || firstOption === '직영마크+로고';

      const [productImg, markImg, logoImg] = await Promise.all([
        loadImage(imageSrc),
        showMark ? loadImage('/direct_mark.png') : Promise.resolve(null),
        showLogo ? loadImage('/cuckoo_logo.png') : Promise.resolve(null),
      ]);

      if (!isSubscribed) return;

      // 3. 중앙 제품 이미지 그리기 (직관적인 스케일 비율 적용)
      if (productImg && productImg.naturalWidth > 0) {
        const scaleRatio = imageScale / 100;

        const baseScale = Math.min(
          width / productImg.naturalWidth,
          height / productImg.naturalHeight
        );

        const drawWidth = productImg.naturalWidth * baseScale * scaleRatio;
        const drawHeight = productImg.naturalHeight * baseScale * scaleRatio;

        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        ctx.drawImage(productImg, x, y, drawWidth, drawHeight);
      }

      // 4. 마크 & 로고 그려주기
      const marginX = width * 0.07;
      const marginY = height * 0.07;

      // 직영 마크 (왼쪽 상단)
      if (markImg && markImg.naturalWidth > 0) {
        const markWidth = width * 0.14;
        const markHeight = markWidth * (markImg.naturalHeight / markImg.naturalWidth);
        ctx.drawImage(markImg, marginX, marginY, markWidth, markHeight);
      }

      // 쿠쿠 로고 (오른쪽 상단 - 윗단 일치 보정 적용)
      if (logoImg && logoImg.naturalWidth > 0) {
        const logoWidth = width * 0.24;
        const logoHeight = logoWidth * (logoImg.naturalHeight / logoImg.naturalWidth);
        const logoX = width - marginX - logoWidth;
        const logoOffsetY = marginY - (height * 0.10);

        ctx.drawImage(logoImg, logoX, logoOffsetY, logoWidth, logoHeight);
      }
    };

    renderCanvas();

    return () => {
      isSubscribed = false;
    };
  // 2. 의존성 배열에 imageScale 추가
  }, [firstOption, bgColor, selectedPlatform, imageSrc, imageScale]);

  const handlePlatformChange = (e) => {
    const target = PLATFORM_PRESETS.find((p) => p.id === e.target.value);
    if (target) setSelectedPlatform(target);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImageSrc(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${selectedPlatform.name}_${selectedPlatform.width}x${selectedPlatform.height}.${format}`;
    link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
    link.click();
  };

  return (
    <div className="landing-container">
      <header className="header">
        <div className="logo">SJN 배너지옥 탈출모임</div>
        <button className="help-btn" title="도움말">?</button>
      </header>

      <main className="content">
        <section className="control-panel">
          {/* 타입 선택 영역 */}
          <div className="option-group">
            <span className="group-title">타입 선택</span>
            <div className="radio-items">
              {['공백', '직영마크', '쿠쿠로고', '직영마크+로고'].map((option) => (
                <label key={option} className="radio-label">
                  <input
                    type="radio"
                    name="firstOption"
                    value={option}
                    checked={firstOption === option}
                    onChange={(e) => setFirstOption(e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>

            {/* 배경색 피커 */}
            <div className="color-picker-wrapper">
              <label htmlFor="bgColor">배경색:</label>
              <input
                type="color"
                id="bgColor"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <span className="color-code">{bgColor}</span>
            </div>
          </div>

          {/* 유통 채널 드롭박스 */}
          <div className="option-group">
            <span className="group-title">유통 채널</span>
            <select
              className="select-box"
              value={selectedPlatform.id}
              onChange={handlePlatformChange}
            >
              {PLATFORM_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.width} x {p.height})
                </option>
              ))}
            </select>
          </div>

          {/* 3. 중복을 제거한 누끼 이미지 업로드 및 슬라이더 영역 */}
          <div className="option-group">
            <label className="file-upload-btn">
              누끼 이미지 업로드
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>

            {imageSrc && (
              <div className="slider-wrapper" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label htmlFor="scaleRange" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>제품 크기 조절:</label>
                  <span style={{ fontSize: '0.9rem', color: '#555' }}>{imageScale}%</span>
                </div>
                <input
                  type="range"
                  id="scaleRange"
                  min="10"
                  max="95"
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>
        </section>

        {/* 썸네일 미리보기 */}
        <section className="preview-panel">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={selectedPlatform.width}
              height={selectedPlatform.height}
              className="thumbnail-canvas"
            />
          </div>

          <div className="download-buttons">
            <button className="dl-btn" onClick={() => handleDownload('png')}>PNG 다운로드</button>
            <button className="dl-btn" onClick={() => handleDownload('jpg')}>JPG 다운로드</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;