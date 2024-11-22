import InteractiveCarousel from '@components/Media/InteractiveCarousel';
export const carouselSize = "w-full md:max-w-lg md:max-h-[300px] md:h-[300px]";
export const slideSize = "w-full h-auto md:max-h-[300px] object-contain";
<InteractiveCarousel client:load items={items} slideSize={slideSize} opts={{
    align: "start",
    loop: true,
  }}
 />