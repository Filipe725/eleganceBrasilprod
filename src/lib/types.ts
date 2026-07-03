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
