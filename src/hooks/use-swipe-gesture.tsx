import { useEffect, useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  maxSwipeTime = 300
}: SwipeGestureOptions) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwipeActive(false);
      return;
    }

    const distance = touchStart.x - touchEnd.x;
    const timeElapsed = touchEnd.time - touchStart.time;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    const isQuickSwipe = timeElapsed < maxSwipeTime;

    // Check if it's more horizontal than vertical
    const verticalDistance = Math.abs(touchStart.y - touchEnd.y);
    const horizontalDistance = Math.abs(distance);
    const isHorizontalSwipe = horizontalDistance > verticalDistance;

    if (isQuickSwipe && isHorizontalSwipe) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwipeActive(false);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight]);

  return elementRef;
}