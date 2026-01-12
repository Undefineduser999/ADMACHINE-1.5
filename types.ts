
export type TargetAudience = 'Iniciante' | 'Profissional' | 'Empreendedor' | 'Cliente final';
export type OfferType = 'Curso online' | 'Curso presencial' | 'Mentoria' | 'Serviço';
export type CampaignObjective = 'Aprendizado / Habilidade Prática' | 'Transformação / Posicionamento / Autoridade';
export type VisualStyle = 'Minimalista' | 'Impactante' | 'Moderno' | 'Futurista' | 'Educacional' | 'Emocional';
export type AdFormat = 'Feed' | 'Stories';

export interface ReferenceImage {
  data: string;
  mimeType: string;
}

export interface AdFormInputs {
  product: string;
  audience: TargetAudience;
  offerType: OfferType;
  objective: CampaignObjective;
  visualStyles: VisualStyle[];
  format: AdFormat;
  includeCta: boolean;
  referenceImage?: ReferenceImage;
}

export interface AdCreative {
  visualPrompt: {
    scene: string;
    style: string;
    emotion: string;
    lighting: string;
    fullDescription: string;
  };
  imageOverlay: {
    mainText: string;
    cta?: string;
  };
  instagramCaption: string;
}

export interface GeneratedImage {
  url: string;
  isLoading: boolean;
  error?: string;
}

export interface NanoMessage {
  role: 'user' | 'assistant';
  text: string;
}
