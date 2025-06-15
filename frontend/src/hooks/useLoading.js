import { useState, useCallback } from 'react';

const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);

  const startLoading = useCallback((text = '') => {
    setIsLoading(true);
    setLoadingText(text);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingText('');
  }, []);

  const setLoadingError = useCallback((errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
    setLoadingText('');
  }, []);

  const withLoading = useCallback(async (asyncFunction, loadingMessage = '') => {
    try {
      startLoading(loadingMessage);
      const result = await asyncFunction();
      stopLoading();
      return result;
    } catch (err) {
      setLoadingError(err.message || 'Ha ocurrido un error');
      throw err;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    loadingText,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading
  };
};

export default useLoading;