
import React, { useState } from 'react';
import { AdCreative, GeneratedImage, NanoMessage } from '../types';
import { editImageNano } from '../services/geminiService';

interface AdResultProps {
  creative: AdCreative;
  setCreative: React.Dispatch<React.SetStateAction<AdCreative | null>>;
  image: GeneratedImage;
  setImage: React.Dispatch<React.SetStateAction<GeneratedImage>>;
  onGenerateImage: () => void;
  format: string;
}

export const AdResult: React.FC<AdResultProps> = ({ creative, setCreative, image, setImage, onGenerateImage, format }) => {
  const [nanoInput, setNanoInput] = useState('');
  const [nanoLoading, setNanoLoading] = useState(false);
  const [nanoHistory, setNanoHistory] = useState<NanoMessage[]>([]);
  const [downloading, setDownloading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = async () => {
    if (!image.url) return;
    setDownloading(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = image.url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Desenhar Imagem Base
      ctx.drawImage(img, 0, 0);

      // 2. Desenhar Gradiente de Fundo (Garante legibilidade do texto)
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

      // 3. Configurações de Texto
      const padding = canvas.width * 0.08;
      const isStories = format === 'Stories';
      const fontSize = isStories ? canvas.width * 0.075 : canvas.width * 0.065;
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${fontSize}px Inter, -apple-system, sans-serif`;

      const mainText = creative.imageOverlay.mainText.toUpperCase();
      const words = mainText.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      const maxWidth = canvas.width - (padding * 2);
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      // 4. Desenhar Título Principal
      const textStartY = canvas.height * (creative.imageOverlay.cta ? 0.70 : 0.85);
      const lineHeight = fontSize * 1.15;

      lines.forEach((line, index) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillText(line, canvas.width / 2, textStartY + (index * lineHeight));
      });

      // 5. Desenhar CTA (Botão Azul ADMACHINE)
      if (creative.imageOverlay.cta) {
        const ctaText = creative.imageOverlay.cta.toUpperCase();
        const ctaFontSize = fontSize * 0.38;
        ctx.font = `900 ${ctaFontSize}px Inter, sans-serif`;
        ctx.shadowBlur = 0;
        
        const ctaMetrics = ctx.measureText(ctaText);
        const btnPaddingX = ctaFontSize * 2.2;
        const btnPaddingY = ctaFontSize * 1.3;
        const btnWidth = ctaMetrics.width + (btnPaddingX * 2);
        const btnHeight = ctaFontSize + (btnPaddingY * 2);
        const btnX = (canvas.width - btnWidth) / 2;
        const btnY = textStartY + (lines.length * lineHeight) + (fontSize * 0.6);

        // Sombras e brilho para o botão
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;

        // Caixa do Botão (Estilo iOS/ADMACHINE)
        ctx.fillStyle = '#0071e3'; // Azul ADMACHINE
        const radius = 12;
        ctx.beginPath();
        ctx.moveTo(btnX + radius, btnY);
        ctx.lineTo(btnX + btnWidth - radius, btnY);
        ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + radius);
        ctx.lineTo(btnX + btnWidth, btnY + btnHeight - radius);
        ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - radius, btnY + btnHeight);
        ctx.lineTo(btnX + radius, btnY + btnHeight);
        ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - radius);
        ctx.lineTo(btnX, btnY + radius);
        ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
        ctx.closePath();
        ctx.fill();

        // Texto do Botão
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'white';
        ctx.fillText(ctaText, canvas.width / 2, btnY + (btnHeight / 2) + 2);
      }

      // 6. Finalizar Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `admachine-${format.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Erro ao gerar download:", err);
      alert("Falha ao compor imagem final. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  const handleNanoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nanoInput.trim() || !image.url || nanoLoading) return;

    const currentPrompt = nanoInput;
    setNanoInput('');
    setNanoLoading(true);
    setNanoHistory(prev => [...prev, { role: 'user', text: currentPrompt }]);

    try {
      const { imageUrl, updatedCreative, summary } = await editImageNano(image.url, currentPrompt, format);
      
      // Atualiza a imagem base
      setImage({ ...image, url: imageUrl, isLoading: false });
      
      // Sincroniza o estado 'creative' com os novos textos para o overlay e download
      setCreative(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          imageOverlay: updatedCreative.imageOverlay,
          instagramCaption: updatedCreative.instagramCaption,
          visualPrompt: {
            ...prev.visualPrompt,
            style: updatedCreative.artStyle || prev.visualPrompt.style
          }
        };
      });

      setNanoHistory(prev => [...prev, { role: 'assistant', text: summary }]);
    } catch (err) {
      console.error(err);
      setNanoHistory(prev => [...prev, { role: 'assistant', text: 'Erro técnico no motor ADMACHINE. Tente outro comando.' }]);
    } finally {
      setNanoLoading(false);
    }
  };

  const isStories = format === 'Stories';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="grid grid-cols-1 gap-12">
        
        {/* Visual Preview Area with Nano Chat Panel */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#86868b]">Motor Creative Optimizer</h3>
            <span className="text-[10px] font-black text-white bg-[#1c1c1e] border border-[#2c2c2e] px-2 py-1 rounded uppercase tracking-[0.2em]">{format}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className={`relative dark-card overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group h-fit border-[#3a3a3c] ${isStories ? 'aspect-[9/16] max-w-[340px] mx-auto' : 'aspect-square'}`}>
                {image.isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#000000]/80 backdrop-blur-xl z-10">
                    <div className="w-10 h-10 border-2 border-[#1c1c1e] border-t-[#0071e3] rounded-full animate-spin mb-6"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0071e3]">Sincronizando Camadas</p>
                  </div>
                ) : image.url ? (
                  <>
                    <img src={image.url} alt="Post preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8 text-white text-center">
                      <h2 className={`font-black uppercase tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,1)] leading-tight animate-in fade-in zoom-in duration-500 ${isStories ? 'text-2xl mb-8' : 'text-xl mb-4'}`}>
                        {creative.imageOverlay.mainText}
                      </h2>
                      {creative.imageOverlay.cta && (
                        <div className="inline-block self-center px-4 py-2 bg-[#0071e3] text-white font-black text-[10px] rounded uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                          {creative.imageOverlay.cta}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#1c1c1e]">
                    <button 
                      onClick={onGenerateImage}
                      className="bg-[#0071e3] border border-[#0071e3] hover:bg-[#0077ed] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl"
                    >
                      Gerar Primeiro Draft
                    </button>
                  </div>
                )}
              </div>

              {/* Download Section com Título + CTA Azul */}
              {image.url && !image.isLoading && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-[#161617] border border-[#2c2c2e] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2c2c2e] flex items-center justify-center text-[#30d158]">
                        {downloading ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-[#30d158] rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#f5f5f7] uppercase tracking-wider">Asset Composto</span>
                        <span className="text-[9px] text-[#86868b] uppercase tracking-[0.1em]">
                          {downloading ? 'Processando UI...' : `Título + Botão Azul de CTA Inclusos`}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center gap-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#f5f5f7] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-[#3a3a3c] hover:border-[#0071e3] disabled:opacity-50"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {downloading ? 'Gerando...' : 'Baixar Criativo Final'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nano-Alteration Panel */}
            <div className="lg:w-[340px] flex flex-col bg-[#0a0a0a] border border-[#2c2c2e] rounded-2xl overflow-hidden shadow-2xl h-[500px]">
              <div className="p-4 border-b border-[#2c2c2e] bg-[#161617] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#f5f5f7]">Nano Ajustes (Camadas)</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                {nanoHistory.length === 0 && (
                  <div className="text-center py-12 px-4 opacity-40">
                    <svg className="w-6 h-6 mx-auto mb-4 text-[#48484a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
                      Solicite ajustes rápidos.<br/>
                      A ADMACHINE altera o título,<br/>
                      o CTA e as cores simultaneamente.
                    </p>
                  </div>
                )}
                {nanoHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[95%] px-3 py-2.5 rounded-xl text-[10px] font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#0071e3] text-white shadow-lg' 
                        : 'bg-[#1c1c1e] border border-[#2c2c2e] text-[#f5f5f7] whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {nanoLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1c1c1e] border border-[#2c2c2e] px-4 py-3 rounded-xl flex items-center gap-2">
                       <span className="text-[9px] font-black text-[#86868b] uppercase tracking-widest animate-pulse">Recalibrando Design...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleNanoSubmit} className="p-4 border-t border-[#2c2c2e] bg-[#161617]">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Refinar criativo..."
                    disabled={nanoLoading || !image.url}
                    className="w-full bg-[#0a0a0a] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[11px] text-[#f5f5f7] placeholder-[#48484a] focus:outline-none focus:border-[#0071e3] transition-colors pr-10"
                    value={nanoInput}
                    onChange={(e) => setNanoInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={nanoLoading || !image.url || !nanoInput.trim()}
                    className="absolute right-3 top-3 text-[#0071e3] disabled:opacity-20 hover:scale-110 transition-transform"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Copy & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="dark-card p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-[#86868b] uppercase tracking-[0.2em]">Legenda do Criativo</h4>
              <button onClick={() => copyToClipboard(creative.instagramCaption)} className="text-[#0071e3] text-[10px] font-black hover:text-white uppercase tracking-widest">Copiar Texto</button>
            </div>
            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#2c2c2e]">
              <p className="text-sm text-[#f5f5f7] leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto custom-scrollbar font-medium">
                {creative.instagramCaption}
              </p>
            </div>
          </div>

          <div className="dark-card p-8 space-y-6">
             <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-[#86868b] uppercase tracking-[0.2em]">Diretrizes de Conversão</h4>
            </div>
            <div className="space-y-4 pt-2">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-[#48484a] uppercase tracking-widest">Contexto Visual</span>
                 <span className="text-[12px] font-bold text-[#f5f5f7]">{creative.visualPrompt.scene}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-[#48484a] uppercase tracking-widest">Estilo & Estética</span>
                 <span className="text-[12px] font-bold text-[#f5f5f7]">{creative.visualPrompt.style}</span>
               </div>
            </div>
            <button 
              onClick={() => copyToClipboard(creative.visualPrompt.fullDescription)}
              className="w-full mt-6 py-3 border border-[#2c2c2e] bg-transparent rounded-lg text-[9px] font-black text-[#86868b] hover:text-white hover:border-[#48484a] transition-all uppercase tracking-[0.15em]"
            >
              Exportar Prompt Técnico
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
