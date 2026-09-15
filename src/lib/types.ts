export type Genero = 'Masculino' | 'Feminino' | 'Unissex';

export interface Perfume {
  id: string;
  nome: string;
  marca: string; // ex: "Lancôme", "Giorgio Armani"
  descricao: string | null; // descrição completa (página de produto)
  resumo: string | null; // texto curto (~100 caracteres) exibido no card da vitrine
  notas_olfativas: string | null;
  preco_antigo: number | null; // preço "de" (ancoragem); opcional
  preco_atual: number; // preço "por" (vigente)
  familia_olfativa: string[]; // ex: ["Amadeirado", "Cítrico"]
  tamanho: string[]; // ex: ["50ml", "100ml"]
  fotos: string[]; // URLs da galeria; fotos[0] é a capa
  tag_destaque: string | null;
  genero: Genero;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BannerSeccao {
  id: string;
  seccao: string; // slug (ex: 'mais-vendidos'), usado no tag_destaque e como âncora
  titulo: string; // ex: 'OS MAIS VENDIDOS'
  imagem_desktop_url: string | null;
  imagem_mobile_url: string | null;
  link_destino: string | null;
  exibir_banner: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface HeroSlide {
  id: string;
  titulo: string;
  subtitulo: string | null;
  texto_botao: string | null;
  url_destino: string | null;
  imagem_desktop_url: string | null; // arte larga, ex: 1920x600px
  imagem_mobile_url: string | null; // arte vertical, ex: 800x1000px
  ativo: boolean;
  ordem: number;
  agendamento_inicio: string | null; // ISO; slide só aparece a partir desta data/hora
  agendamento_fim: string | null; // ISO; slide some após esta data/hora
  created_at: string;
  updated_at: string;
}

export interface HeroConfig {
  intervalo_segundos: number;
  autoplay_ativo: boolean;
}

export interface CartItem {
  perfume: Perfume;
  quantidade: number;
}
