import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MatchmakingStats {
  averageWaitTime: number;
  activePlayersCount: number;
  historicalMatches: number;
}

interface UseMatchmakingTimeProps {
  gameType: 'solo' | 'partnered';
  wagerAmount: number;
  timeWindow?: number; // time window in hours to look back for historical data
}

export const useMatchmakingTime = ({ 
  gameType, 
  wagerAmount, 
  timeWindow = 24 
}: UseMatchmakingTimeProps) => {
  const [estimatedTime, setEstimatedTime] = useState<number>(60); // default 60 seconds
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateEstimatedTime = async () => {
      try {
        setIsLoading(true);
        const timeWindowStart = new Date();
        timeWindowStart.setHours(timeWindowStart.getHours() - timeWindow);

        // Get historical matchmaking stats
        const { data: matchStats, error: matchError } = await supabase
          .from('games')
          .select('created_at, started_at, players_count')
          .eq('type', gameType)
          .eq('wager_amount', wagerAmount)
          .gte('created_at', timeWindowStart.toISOString())
          .not('started_at', 'is', null);

        if (matchError) throw matchError;

        // Get current active players in matchmaking
        const { data: activePlayers, error: activeError } = await supabase
          .from('games')
          .select('id, created_at, players_count')
          .eq('type', gameType)
          .eq('wager_amount', wagerAmount)
          .eq('status', 'waiting');

        if (activeError) throw activeError;

        // Calculate statistics
        const stats: MatchmakingStats = {
          averageWaitTime: 0,
          activePlayersCount: 0,
          historicalMatches: matchStats?.length || 0
        };

        // Calculate average wait time from historical data
        if (matchStats && matchStats.length > 0) {
          const waitTimes = matchStats.map(match => {
            const startTime = new Date(match.started_at);
            const createTime = new Date(match.created_at);
            return (startTime.getTime() - createTime.getTime()) / 1000; // convert to seconds
          });

          stats.averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
        }

        // Calculate active players count
        if (activePlayers) {
          stats.activePlayersCount = activePlayers.reduce((sum, game) => sum + (game.players_count || 0), 0);
        }

        // Calculate estimated time based on multiple factors
        let estimatedSeconds = 60; // base time of 60 seconds

        // Factor 1: Historical average wait time (weighted at 40%)
        if (stats.averageWaitTime > 0) {
          estimatedSeconds = stats.averageWaitTime * 0.4;
        }

        // Factor 2: Active players adjustment (weighted at 30%)
        const playersNeeded = gameType === 'solo' ? 4 : 4; // both modes need 4 players
        if (stats.activePlayersCount > 0) {
          const playerFactor = Math.max(0.5, (playersNeeded - stats.activePlayersCount) / playersNeeded);
          estimatedSeconds += (estimatedSeconds * playerFactor * 0.3);
        } else {
          estimatedSeconds *= 1.3; // increase by 30% if no active players
        }

        // Factor 3: Time of day adjustment (weighted at 15%)
        const hour = new Date().getHours();
        const peakHours = [20, 21, 22, 23, 0, 1, 2, 3]; // peak gaming hours (8 PM - 3 AM)
        const isOffPeak = !peakHours.includes(hour);
        if (isOffPeak) {
          estimatedSeconds *= 1.15; // increase by 15% during off-peak hours
        }

        // Factor 4: Wager amount adjustment (weighted at 15%)
        if (wagerAmount > 0) {
          const wagerFactor = Math.log10(wagerAmount + 1) / 2; // logarithmic scaling
          estimatedSeconds *= (1 + wagerFactor * 0.15);
        }

        // Ensure minimum and maximum bounds
        estimatedSeconds = Math.max(30, Math.min(900, estimatedSeconds)); // between 30 seconds and 15 minutes
        
        // Round to nearest 30 seconds
        estimatedSeconds = Math.round(estimatedSeconds / 30) * 30;

        setEstimatedTime(estimatedSeconds);
        setIsLoading(false);
      } catch (error) {
        console.error('Error calculating matchmaking time:', error);
        setEstimatedTime(60); // fallback to 60 seconds
        setIsLoading(false);
      }
    };

    calculateEstimatedTime();
    
    // Recalculate every minute
    const interval = setInterval(calculateEstimatedTime, 60000);
    
    return () => clearInterval(interval);
  }, [gameType, wagerAmount, timeWindow]);

  // Format the time as MM:SS
  const formattedTime = new Date(estimatedTime * 1000)
    .toISOString()
    .substr(14, 5);

  return {
    estimatedTime,
    formattedTime,
    isLoading
  };
}; 