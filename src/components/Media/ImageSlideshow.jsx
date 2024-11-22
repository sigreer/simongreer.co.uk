import { useState, useEffect } from 'react';

export default function ImageSlideshow({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setPreviousIndex(currentIndex);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length, currentIndex]);

  const handlePrevious = () => {
    setIsAnimating(true);
    setPreviousIndex(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setIsAnimating(true);
    setPreviousIndex(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-b-lg border-white border-4 drop-shadow-lg my-8">
      <div className="relative w-full h-full">
        {/* Exiting image */}
        <div
          key={`exit-${previousIndex}`}
          className={`absolute inset-0 ${isAnimating ? 'animate-fadeOut' : ''}`}
        >
          <img
            src={images[previousIndex].src}
            alt={images[previousIndex].alt}
            className="w-full h-full object-cover bg-gradient-to-br from-pink-400 to-pink-900"
          />
        </div>

        {/* Entering image */}
        <div
          key={`enter-${currentIndex}`}
          className={`absolute inset-0 ${isAnimating ? 'animate-fadeIn' : ''}`}
          onAnimationEnd={() => setIsAnimating(false)}
        >
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            className="w-full h-full object-cover bg-gradient-to-br from-pink-400 to-pink-900"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center">
            {images[currentIndex].alt}
          </div>
        </div>

        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
        >
          ←
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
        >
          →
        </button>
      </div>
    </div>
  );
} 