export interface Perfume {
  id: string;
  nome: string;
  marca: string; // ex: "Lancôme", "Giorgio Armani"
  descricao: string | null;
  notas_olfativas: string | null;
  preco_antigo: number | null; // preço "de" (ancoragem); opcional
  preco_atual: number; // preço "por" (vigente)
  familia_olfativa: string[]; // ex: ["Amadeirado", "Cítrico"]
  tamanho: string[]; // ex: ["50ml", "100ml"]
  imagem_url: string | null;
  tag_destaque: string | null;
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

export interface CartItem {
  perfume: Perfume;
  quantidade: number;
}
