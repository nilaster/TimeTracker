import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/AppStyles';

export default function App() {
  const [hourlyRate, setHourlyRate] = useState<string>('25.00');
  const [time, setTime] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [editingTime, setEditingTime] = useState<boolean>(false);
  const [tempHours, setTempHours] = useState<string>('0');
  const [tempMinutes, setTempMinutes] = useState<string>('0');
  const [tempSeconds, setTempSeconds] = useState<string>('0');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isRunning && backgroundTimeRef.current) {
          const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          setTime(prevTime => prevTime + timeInBackground);
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        if (isRunning) {
          backgroundTimeRef.current = Date.now();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      backgroundTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateEarnings = (): string => {
    const hours = time / 3600;
    const earnings = hours * parseFloat(hourlyRate || '0');
    return earnings.toFixed(2);
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (isRunning) {
      Alert.alert(
        'Timer Running',
        'Please stop the timer before resetting.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => setTime(0)
        }
      ]
    );
  };

  const handleEditTime = () => {
    if (isRunning) {
      Alert.alert(
        'Timer Running',
        'Please stop the timer before editing time.',
        [{ text: 'OK' }]
      );
      return;
    }

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    setTempHours(hours.toString());
    setTempMinutes(minutes.toString());
    setTempSeconds(seconds.toString());
    setEditingTime(true);
  };

  const handleSaveTime = () => {
    const hours = parseInt(tempHours) || 0;
    const minutes = parseInt(tempMinutes) || 0;
    const seconds = parseInt(tempSeconds) || 0;
    
    if (minutes >= 60 || seconds >= 60) {
      Alert.alert('Invalid Time', 'Minutes and seconds must be less than 60.');
      return;
    }
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setTime(totalSeconds);
    setEditingTime(false);
  };

  const handleCancelEdit = () => {
    setEditingTime(false);
  };

  const formatHourlyRate = (value: string): string => {
    // Remove any non-digit and non-decimal characters
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points - keep only the first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      const formatted = parts[0] + '.' + parts.slice(1).join('');
      return formatted.substring(0, formatted.indexOf('.') + 3); // Keep only 2 decimal places
    }
    
    // If there's a decimal point, limit to 2 decimal places
    if (parts.length === 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handleHourlyRateChange = (value: string) => {
    const formatted = formatHourlyRate(value);
    setHourlyRate(formatted);
  };

  const handleHourlyRateBlur = () => {
    if (hourlyRate === '' || hourlyRate === '.') {
      setHourlyRate('0.00');
      return;
    }

    const numValue = parseFloat(hourlyRate);
    if (isNaN(numValue) || numValue < 0) {
      setHourlyRate('0.00');
      return;
    }

    // Format to always show 2 decimal places
    setHourlyRate(numValue.toFixed(2));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Time Tracker</Text>
        {isRunning && (
          <View style={styles.runningIndicator}>
            <View style={styles.runningDot} />
            <Text style={styles.runningText}>Running</Text>
          </View>
        )}
      </View>

      {/* Hourly Rate Section */}
      <View style={styles.rateSection}>
        <Text style={styles.rateLabel}>Hourly Rate</Text>
        <View style={styles.rateInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.rateInput}
            value={hourlyRate}
            onChangeText={handleHourlyRateChange}
            onBlur={handleHourlyRateBlur}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        {editingTime ? (
          <View style={styles.editTimeContainer}>
            <Text style={styles.editLabel}>Edit Time</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={styles.timeInput}
                  value={tempHours}
                  onChangeText={setTempHours}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeInputLabel}>h</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={styles.timeInput}
                  value={tempMinutes}
                  onChangeText={setTempMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeInputLabel}>m</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={styles.timeInput}
                  value={tempSeconds}
                  onChangeText={setTempSeconds}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeInputLabel}>s</Text>
              </View>
            </View>
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTime}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={handleEditTime} activeOpacity={0.7}>
              <Text style={styles.timerDisplay}>{formatTime(time)}</Text>
              <Text style={styles.editHint}>Tap to edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Earnings Display */}
      <View style={styles.earningsSection}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>${calculateEarnings()}</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={24} color="#666" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.startStopButton,
            isRunning ? styles.stopButton : styles.startButton
          ]}
          onPress={handleStartStop}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={32} 
            color="white" 
          />
          <Text style={styles.startStopButtonText}>
            {isRunning ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}