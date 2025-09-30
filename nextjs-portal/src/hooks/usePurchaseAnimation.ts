import { useState, useCallback } from 'react';

interface UsePurchaseAnimationResult {
  isSuccessModalOpen: boolean;
  triggerPurchaseAnimation: (onAnimationEnd: () => void) => void;
}

export const usePurchaseAnimation = (): UsePurchaseAnimationResult => {
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);

  const triggerPurchaseAnimation = useCallback((onAnimationEnd: () => void) => {
    // 1. Open the success modal
    setSuccessModalOpen(true);

    // 3. After the animation duration, reset states
    const resetTimer = setTimeout(() => {
      onAnimationEnd(); // Call the callback (e.g., clearCart)
      setSuccessModalOpen(false); // Close the modal
    }, 2000); // Total duration for the success message to be visible

    // Cleanup timers if the component unmounts
    return () => {
      clearTimeout(resetTimer);
    };
  }, []); // No dependencies, this function is stable

  return { isSuccessModalOpen, triggerPurchaseAnimation };
};
