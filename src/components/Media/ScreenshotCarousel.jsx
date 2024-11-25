import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import input1 from '@images/galleries/magick-tricks/input1.png'
import input2 from '@images/galleries/magick-tricks/input2.png'
import flash1 from '@images/galleries/magick-tricks/flash1.png'
import flash2 from '@images/galleries/magick-tricks/flash2.png'
import tilted1 from '@images/galleries/magick-tricks/tilted1.png'
import tilted2 from '@images/galleries/magick-tricks/tilted2.png'
import mergedTiltedOutwards from '@images/galleries/magick-tricks/merged-tilted-outwards.png'
import mergedTiltedInwards from '@images/galleries/magick-tricks/merged-tilted-inwards.png'

const screenshots = [
    {
        src: input1.src,
        alt: "Screenshot source image 1"
    },
    {
      src: flash1.src,
      alt: "Screenshot flash image 1"
  },
    {
        src: input2.src,
        alt: "Screenshot source image 2"
    },
    {
        src: flash2.src,
        alt: "Screenshot flash image 2"
    },
    {
        src: tilted1.src,
        alt: "Screenshot tilted image 1"
    },
    {
        src: tilted2.src,
        alt: "Screenshot tilted image 2"
    },
    {
        src: mergedTiltedOutwards.src,
        alt: "Screenshot merged tilted outwards"
    },
    {
        src: mergedTiltedInwards.src,
        alt: "Screenshot merged tilted inwards"
    }
]

export default function ScreenshotCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [prevIndex, setPrevIndex] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [direction, setDirection] = useState(1)

    const handleImageChange = (newIndex) => {
        setPrevIndex(currentIndex)
        
        // Handle wrapping around the array
        let normalizedIndex = newIndex
        if (newIndex < 0) normalizedIndex = screenshots.length - 1
        if (newIndex >= screenshots.length) normalizedIndex = 0
        
        // Determine direction based on shortest path around the array
        const isWrappingForward = currentIndex === screenshots.length - 1 && normalizedIndex === 0
        const isWrappingBackward = currentIndex === 0 && normalizedIndex === screenshots.length - 1
        
        if (isWrappingForward || (!isWrappingBackward && normalizedIndex > currentIndex)) {
            setDirection(1)
        } else {
            setDirection(-1)
        }
        
        setCurrentIndex(normalizedIndex)
    }

    useEffect(() => {
        const interval = setInterval(() => {
            handleImageChange(currentIndex + 1)
        }, 3000)

        return () => clearInterval(interval)
    }, [currentIndex])

    const handleDotClick = (index) => {
        handleImageChange(index)
    }

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            <div 
                className="aspect-[2/1] relative cursor-pointer border overflow-hidden"
                onClick={() => setIsOpen(true)}
            >
                <div className="absolute inset-0">
                    <img 
                        key={`prev-${prevIndex}`}
                        src={screenshots[prevIndex].src}
                        alt={screenshots[prevIndex].alt}
                        className={`absolute w-full h-full object-contain opacity-100
                            ${direction > 0 ? 'animate-slideOutLeft' : 'animate-slideOutRight'}`}
                    />
                </div>
                <div className="absolute inset-0">
                    <img 
                        key={`current-${currentIndex}`}
                        src={screenshots[currentIndex].src}
                        alt={screenshots[currentIndex].alt}
                        className={`absolute w-full h-full object-contain opacity-0
                            ${direction > 0 ? 'animate-slideInRight' : 'animate-slideInLeft'}`}
                    />
                </div>
            </div>

            <p className="text-center mt-2 text-sm text-gray-600">
                {screenshots[currentIndex].alt}
            </p>

            <div className="flex justify-center gap-2 mt-4">
                {screenshots.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                            index === currentIndex 
                                ? 'bg-blue-500 scale-125' 
                                : 'bg-gray-300'
                        }`}
                    />
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                    <img 
                        src={screenshots[currentIndex].src}
                        alt={screenshots[currentIndex].alt}
                        className="w-full h-full object-contain"
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}