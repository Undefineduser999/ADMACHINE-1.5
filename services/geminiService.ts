
import { GoogleGenAI, Type } from "@google/genai";
import { AdFormInputs, AdCreative, ReferenceImage } from "../types";

const SYSTEM_PROMPT_BASE = `Você é um especialista em marketing de performance e Creative Optimizer da ADMACHINE para Instagram.
OBJETIVO: Gerar e otimizar criativos de alta conversão com design intrigante.
FRASE-GUIA: "Iterar pequeno, rápido e inteligente gera criativos vencedores."

DIRETRIZES TÉCNICAS:
1. Analise legibilidade, hierarquia visual e impacto psicológico.
2. Foque em gatilhos: curiosidade, antecipação, tensão ou desejo.
3. Mantenha a identidade visual e coerência estética através das camadas.
4. DESIGN INTRIGANTE: Use tipografia impactante e comunique a mensagem em 3 segundos.
5. TODA A SAÍDA DEVE SER EM PORTUGUÊS (BR). O nome "ADMACHINE" nunca deve ser traduzido.`;

export const generateAdCreative = async (inputs: AdFormInputs): Promise<AdCreative> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `${SYSTEM_PROMPT_BASE}
Sua saída deve ser estritamente em JSON seguindo o esquema fornecido. Garanta que todos os campos de texto estejam em Português.`;

  const textPart = {
    text: `Gere um criativo inicial para Instagram com design intrigante:
- Produto/Nicho: ${inputs.product}
- Público: ${inputs.audience}
- Tipo de Oferta: ${inputs.offerType}
- Objetivo: ${inputs.objective}
- Estilos Visuais: ${inputs.visualStyles.join(', ')}
- Formato: ${inputs.format}
- Incluir CTA: ${inputs.includeCta ? 'Sim' : 'Não'}
${inputs.referenceImage ? "Analise a imagem de base enviada para manter a coerência estética." : ""}

Siga a estrutura:
1. Descrição Visual (Cena, estilo, luz).
2. Texto para Imagem (Curto, intrigante e forte).
3. CTA direto.
4. Legenda persuasiva.`
  };

  const parts: any[] = [textPart];
  if (inputs.referenceImage) {
    parts.push({
      inlineData: {
        data: inputs.referenceImage.data,
        mimeType: inputs.referenceImage.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualPrompt: {
            type: Type.OBJECT,
            properties: {
              scene: { type: Type.STRING },
              style: { type: Type.STRING },
              emotion: { type: Type.STRING },
              lighting: { type: Type.STRING },
              fullDescription: { type: Type.STRING }
            },
            required: ["scene", "style", "emotion", "lighting", "fullDescription"]
          },
          imageOverlay: {
            type: Type.OBJECT,
            properties: {
              mainText: { type: Type.STRING },
              cta: { type: Type.STRING }
            },
            required: ["mainText"]
          },
          instagramCaption: { type: Type.STRING }
        },
        required: ["visualPrompt", "imageOverlay", "instagramCaption"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateImageFromPrompt = async (
  artPrompt: string, 
  format: string, 
  referenceImage?: ReferenceImage
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const aspectRatio = format === 'Stories' ? "9:16" : "1:1";

  const parts: any[] = [];
  
  if (referenceImage) {
    parts.push({
      inlineData: {
        data: referenceImage.data,
        mimeType: referenceImage.mimeType
      }
    });
    parts.push({
      text: `Creative Optimizer ADMACHINE: Transforme esta imagem com DESIGN INTRIGANTE seguindo este conceito: ${artPrompt}. Mantenha a essência mas eleve o nível visual para alta performance em Ads.`
    });
  } else {
    parts.push({
      text: `Gere uma imagem publicitária com DESIGN INTRIGANTE: ${artPrompt}. Foco em estética de Instagram, tipografia excepcional e impacto imediato.`
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Não foi possível gerar a imagem.");
};

export const editImageNano = async (
  currentImageData: string,
  prompt: string,
  format: string
): Promise<{ imageUrl: string; updatedCreative: any; summary: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const aspectRatio = format === 'Stories' ? "9:16" : "1:1";

  // Passo 1: Edição da imagem por camadas
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: currentImageData.split(',')[1] || currentImageData,
            mimeType: 'image/png'
          }
        },
        {
          text: `Creative Optimizer ADMACHINE - EDIÇÃO POR CAMADAS: Execute esta nano-correção específica: "${prompt}". 
          REGRAS OBRIGATÓRIAS:
          1. PRESERVE rigorosamente elementos não solicitados (composição e enquadramento).
          2. Foque no ajuste visual solicitado (fundo, cores, contraste, expressão, etc).
          3. Não tente renderizar texto na imagem, pois faremos isso via overlay dinâmico para garantir nitidez 100%.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      }
    }
  });

  let newImageUrl = '';
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  // Passo 2: Geração de novos textos estruturados (Obrigatório novo Título Intrigante)
  const metadataResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Com base na nano-correção: "${prompt}", gere a nova configuração de textos para a ADMACHINE.
    VOCÊ DEVE OBRIGATORIAMENTE GERAR UM NOVO TÍTULO INTRIGANTE (diferente do anterior).
    
    Retorne estritamente em JSON:
    {
      "mainText": "Novo título curto e intrigante",
      "cta": "Texto do botão de ação",
      "caption": "Legenda curta atualizada",
      "artStyle": "Descrição do novo estilo de arte aplicado",
      "summary": "Resumo em texto para o chat (Ex: 1️⃣ Descrição visual... 2️⃣ Novo Título...)"
    }`,
    config: {
      systemInstruction: SYSTEM_PROMPT_BASE,
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(metadataResponse.text);

  return { 
    imageUrl: newImageUrl, 
    updatedCreative: {
      imageOverlay: {
        mainText: data.mainText,
        cta: data.cta
      },
      instagramCaption: data.caption,
      artStyle: data.artStyle
    },
    summary: data.summary
  };
};
