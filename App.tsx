
import React, { useState } from 'react';
import { AdFormInputs, AdCreative, GeneratedImage, ReferenceImage } from './types';
import { generateAdCreative, generateImageFromPrompt } from './services/geminiService';
import { AdForm } from './components/AdForm';
import { AdResult } from './components/AdResult';

function App() {
  const [loading, setLoading] = useState(false);
  const [creative, setCreative] = useState<AdCreative | null>(null);
  const [activeFormat, setActiveFormat] = useState<string>('Feed');
  const [refImage, setRefImage] = useState<ReferenceImage | undefined>(undefined);
  const [image, setImage] = useState<GeneratedImage>({ url: '', isLoading: false });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AdFormInputs) => {
    setLoading(true);
    setError(null);
    setCreative(null);
    setImage({ url: '', isLoading: false });
    setActiveFormat(data.format);
    setRefImage(data.referenceImage);

    try {
      const result = await generateAdCreative(data);
      setCreative(result);
    } catch (err: any) {
      setError("Não foi possível processar a solicitação. Verifique sua conexão ou tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!creative) return;
    
    setImage({ url: '', isLoading: true });
    try {
      const imageUrl = await generateImageFromPrompt(
        creative.visualPrompt.fullDescription, 
        activeFormat,
        refImage
      );
      setImage({ url: imageUrl, isLoading: false });
    } catch (err: any) {
      setImage({ url: '', isLoading: false, error: "Erro ao renderizar imagem." });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7]">
      {/* Navigation */}
      <header className="dark-blur border-b border-[#2c2c2e] sticky top-0 z-50 h-[52px] flex items-center">
        <div className="max-w-[1000px] mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-6 h-6 bg-[#0071e3] rounded flex items-center justify-center group-hover:bg-[#0077ed] transition-colors">
              <span className="text-[10px] font-black italic text-white">M</span>
            </div>
            <h1 className="text-sm font-black tracking-[0.1em] uppercase">ADMACHINE</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-[11px] font-bold text-[#86868b] hover:text-[#f5f5f7] transition-colors cursor-pointer uppercase tracking-wider">Painel</span>
            <span className="text-[11px] font-bold text-[#86868b] hover:text-[#f5f5f7] transition-colors cursor-pointer uppercase tracking-wider">Modelos</span>
            <span className="text-[11px] font-bold text-[#f5f5f7] border-b border-[#0071e3] cursor-pointer uppercase tracking-wider">Gerador</span>
          </nav>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 py-16">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-[#86868b] bg-clip-text text-transparent">
            A nova era dos anúncios.
          </h2>
          <p className="text-lg md:text-xl text-[#86868b] font-medium max-w-xl mx-auto leading-relaxed">
            ADMACHINE usa inteligência avançada para converter cliques em clientes com design e copy de elite.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Area */}
          <div className="lg:col-span-5">
            <div className="dark-card p-8 sticky top-[80px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#86868b]">Parâmetros</h3>
                <div className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></div>
              </div>
              <AdForm onSubmit={handleSubmit} isSubmitting={loading} />
            </div>
          </div>

          {/* Result Area */}
          <div className="lg:col-span-7">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-xl text-xs font-bold border border-red-800/30">
                {error}
              </div>
            )}

            {!creative && !loading && (
              <div className="dark-card p-12 h-full min-h-[500px] flex flex-col items-center justify-center text-center border-dashed border-[#2c2c2e]">
                <div className="w-16 h-16 bg-[#1c1c1e] rounded-2xl flex items-center justify-center mb-8 border border-[#2c2c2e]">
                   <svg className="w-6 h-6 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                </div>
                <h3 className="text-xl font-black mb-3">Motor de Criação Ativado</h3>
                <p className="text-[#86868b] text-sm leading-relaxed max-w-xs">
                  Insira os dados do seu produto ao lado para que a ADMACHINE processe sua estratégia.
                </p>
              </div>
            )}

            {loading && (
              <div className="dark-card p-12 h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative">
                  <div className="w-14 h-14 border-2 border-[#1c1c1e] border-t-[#0071e3] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#0071e3] rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f5f5f7]">Processando Dados</h3>
                   <p className="text-[#86868b] text-xs font-medium">Calibrando algoritmos de conversão...</p>
                </div>
              </div>
            )}

            {creative && (
              <AdResult 
                creative={creative} 
                setCreative={setCreative}
                image={image} 
                setImage={setImage}
                onGenerateImage={handleGenerateImage}
                format={activeFormat}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="mt-32 py-16 border-t border-[#1c1c1e] bg-[#0a0a0a]">
        <div className="max-w-[1000px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-[11px] text-[#86868b] font-bold uppercase tracking-widest">
            ADMACHINE CORE v2.5
          </div>
          <div className="text-[11px] text-[#86868b] leading-relaxed md:text-right">
            <p>© 2025 ADMACHINE. Todos os direitos reservados. IA de Alta Performance.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
