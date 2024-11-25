import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel";
import { Card, CardContent } from "@components/ui/card";
import Autoplay from "embla-carousel-autoplay"

const InteractiveCarousel = ({ items, slideSize, carouselSize, opts }) => {
  return (
    <Carousel className={carouselSize} opts={opts} plugins={[
      Autoplay({
        delay: 4000,
      }),
    ]}>
      <CarouselContent className="h-full">
        {items.map((item, index) => (
          <CarouselItem key={index} className="h-full">
            <div className="p-0 h-full">
              <Card className="h-full">
                <CardContent className="flex items-center justify-center p-0 flex-col h-full">
                  <div className="h-full w-full flex items-center justify-center">
                    <img 
                      src={item.image} 
                      alt={item.description} 
                      className={slideSize}
                    />
                  </div>
                  <p className="text-sm mt-2">{item.description}</p>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default InteractiveCarousel;