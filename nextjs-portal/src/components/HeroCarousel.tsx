'use client';

import React, { useState, useEffect, Children, useCallback } from 'react';

interface HeroCarouselProps {
  children: React.ReactNode;
  intervalMs?: number;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ children, intervalMs = 6000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = Children.toArray(children);
  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (intervalMs > 0 && totalSlides > 1) {
      const timer = setInterval(goToNext, intervalMs);
      return () => clearInterval(timer);
    }
  }, [goToNext, intervalMs, totalSlides]);

  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg shadow-soft">
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="h-full w-full shrink-0">
            {slide}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" aria-hidden="true" />
      <div className="carousel-indicators z-10">
        {slides.map((_, index) => (
          <button key={index} className="carousel-dot" aria-current={currentIndex === index} aria-label={`Go to slide ${index + 1}`} onClick={() => handleIndicatorClick(index)} />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;

