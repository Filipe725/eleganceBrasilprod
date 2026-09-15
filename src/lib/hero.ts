import type { HeroSlide } from './types';

/**
 * Filtra os slides do Hero que devem aparecer agora: ativos, com pelo
 * menos uma arte enviada e dentro da janela de agendamento (quando
 * configurada). Ordena pelo campo `ordem`.
 */
export function getActiveHeroSlides(
  slides: HeroSlide[],
  now: Date = new Date()
): HeroSlide[] {
  return slides
    .filter((slide) => {
      if (!slide.ativo) return false;
      if (!slide.imagem_desktop_url && !slide.imagem_mobile_url) return false;
      if (slide.agendamento_inicio && new Date(slide.agendamento_inicio) > now)
        return false;
      if (slide.agendamento_fim && new Date(slide.agendamento_fim) < now)
        return false;
      return true;
    })
    .sort((a, b) => a.ordem - b.ordem);
}
