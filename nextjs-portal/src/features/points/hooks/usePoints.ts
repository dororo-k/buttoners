
import { useState, useCallback } from 'react';

interface UsePointsResult {
  points: string | null;
  loading: boolean;
  error: string | null;
  fetchPoints: (employeeId: string) => Promise<void>;
}

const usePoints = (): UsePointsResult => {
  const [points, setPoints] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    setPoints(null);
    try {
      const response = await fetch(`http://localhost:3001/api/points?employeeId=${employeeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPoints(data.points || 'N/A');
    } catch (err) {
      if (err instanceof Error) {
        setError(`포인트를 불러오는 데 실패했습니다: ${err.message}`);
      } else {
        setError(`포인트를 불러오는 데 실패했습니다: ?????녿뒗 ?ㅻ쪟`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { points, loading, error, fetchPoints };
};

export default usePoints;

