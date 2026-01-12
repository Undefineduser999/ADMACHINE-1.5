
import React, { useState, useRef } from 'react';
import { AdFormInputs, VisualStyle, AdFormat, ReferenceImage } from '../types';

interface AdFormProps {
  onSubmit: (data: AdFormInputs) => void;
  isSubmitting: boolean;
}

const VISUAL_STYLES: VisualStyle[] = ['Minimalista', 'Impactante', 'Moderno', 'Futurista', 'Educacional', 'Emocional'];

export const AdForm: React.FC<AdFormProps> = ({ onSubmit, isSubmitting }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<AdFormInputs>({
    product: '',
    audience: 'Iniciante',
    offerType: 'Curso online',
    objective: 'Transformação / Posicionamento / Autoridade',
    visualStyles: ['Moderno'],
    format: 'Feed',
    includeCta: true,
    referenceImage: undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFormData(prev => ({
          ...prev,
          referenceImage: {
            data: base64String,
            mimeType: file.type
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, referenceImage: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleStyle = (style: VisualStyle) => {
    setFormData(prev => {
      const styles = prev.visualStyles.includes(style)
        ? prev.visualStyles.filter(s => s !== style)
        : [...prev.visualStyles, style];
      return { ...prev, visualStyles: styles };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.visualStyles.length === 0) {
      alert("Selecione pelo menos um estilo visual.");
      return;
    }
    onSubmit(formData);
  };

  const inputClasses = "w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-3.5 text-[#f5f5f7] placeholder-[#48484a] focus:outline-none focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3] transition-all text-sm font-medium";
  const labelClasses = "block text-[10px] font-black text-[#86868b] mb-2 uppercase tracking-[0.15em] ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Imagem de Referência */}
      <div>
        <label className={labelClasses}>Imagem de Base (Opcional)</label>
        {!formData.referenceImage ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 bg-[#1c1c1e] border-2 border-dashed border-[#2c2c2e] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#48484a] transition-all group"
          >
            <svg className="w-6 h-6 text-[#48484a] group-hover:text-[#86868b] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold text-[#48484a] uppercase tracking-wider group-hover:text-[#86868b]">Upload de Referência</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>
        ) : (
          <div className="relative w-full h-32 bg-[#1c1c1e] rounded-xl overflow-hidden border border-[#2c2c2e]">
            <img 
              src={`data:${formData.referenceImage.mimeType};base64,${formData.referenceImage.data}`} 
              className="w-full h-full object-cover opacity-50" 
              alt="Reference" 
            />
            <button 
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-3 py-1 rounded">Imagem Ativa</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelClasses}>Produto ou Serviço</label>
        <input 
          required
          name="product"
          placeholder="Ex: Consultoria Premium"
          className={inputClasses}
          value={formData.product}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Audiência</label>
          <select name="audience" className={inputClasses} value={formData.audience} onChange={handleChange}>
            <option value="Iniciante">Iniciante</option>
            <option value="Profissional">Profissional</option>
            <option value="Empreendedor">Empreendedor</option>
            <option value="Cliente final">Cliente final</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Modelo de Oferta</label>
          <select name="offerType" className={inputClasses} value={formData.offerType} onChange={handleChange}>
            <option value="Curso online">Curso online</option>
            <option value="Curso presencial">Curso presencial</option>
            <option value="Mentoria">Mentoria</option>
            <option value="Serviço">Serviço</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Estilo de Arte</label>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {VISUAL_STYLES.map(style => (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all border uppercase tracking-wider ${
                formData.visualStyles.includes(style)
                  ? "bg-[#0071e3] border-[#0071e3] text-white shadow-lg shadow-[#0071e3]/20"
                  : "bg-transparent border-[#2c2c2e] text-[#86868b] hover:border-[#48484a]"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        <div>
          <label className={labelClasses}>Plataforma</label>
          <div className="flex bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-1">
            {(['Feed', 'Stories'] as AdFormat[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormData(p => ({ ...p, format: f }))}
                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                  formData.format === f ? "bg-[#2c2c2e] text-[#f5f5f7] shadow-sm" : "text-[#86868b] hover:text-[#f5f5f7]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-2 h-full pt-6">
          <label className="text-[10px] font-black text-[#86868b] uppercase tracking-widest">Botão CTA</label>
          <button
            type="button"
            onClick={() => setFormData(p => ({ ...p, includeCta: !p.includeCta }))}
            className={`w-10 h-5 rounded-full transition-all relative ${formData.includeCta ? 'bg-[#30d158]' : 'bg-[#2c2c2e]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md ${formData.includeCta ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#f5f5f7] hover:bg-white disabled:opacity-30 text-black font-black py-4 px-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] mt-4 shadow-xl shadow-black/40"
      >
        {isSubmitting ? 'Gerando Algoritmos...' : 'Ativar AdMachine'}
      </button>
    </form>
  );
};
