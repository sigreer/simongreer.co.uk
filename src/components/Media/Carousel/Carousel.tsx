import EmblaCarousel from '@components/Media/Carousel/EmblaCarousel.tsx';
import type { EmblaOptionsType } from 'embla-carousel';
import '@styles/embla.css';

type CarouselProps = {
  slides: Array<{
    image: string
    description: string
  }>
  options?: EmblaOptionsType
}

const Carousel = ({ slides, options }: CarouselProps) => {
  return <EmblaCarousel slides={slides} options={options} />
}

export default Carousel;