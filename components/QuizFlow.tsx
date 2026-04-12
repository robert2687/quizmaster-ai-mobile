import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { QuizQuestion } from '../types';
import TimerBar from './TimerBar';

interface QuizFlowProps {
  questions: QuizQuestion[];
  onQuizComplete: (finalScore: number, answeredQuestions: QuizQuestion[]) => void;
  quizTopic: string;
  onAnswer?: (questionId: string, answer: string, fullQuestion: QuizQuestion) => void;
}

const SECONDS_PER_QUESTION = 20;

const QuizOption = React.memo(function QuizOption({
  option,
  index,
  hasAnswered,
  currentQuestion,
  selectedOption,
  handleSelectOption,
}: {
  option: string;
  index: number;
  hasAnswered: boolean;
  currentQuestion: QuizQuestion;
  selectedOption: string | null;
  handleSelectOption: (option: string) => void;
}) {
  const getOptionStyle = () => {
    if (!hasAnswered) return styles.optionDefault;
    if (option === currentQuestion.correctAnswer) return styles.optionCorrect;
    if (option === selectedOption && option !== currentQuestion.correctAnswer) return styles.optionWrong;
    return styles.optionFaded;
  };

  const getOptionTextStyle = () => {
    if (!hasAnswered) return styles.optionTextDefault;
    if (option === currentQuestion.correctAnswer) return styles.optionTextCorrect;
    if (option === selectedOption && option !== currentQuestion.correctAnswer) return styles.optionTextWrong;
    return styles.optionTextFaded;
  };

  const getOptionIcon = () => {
    if (!hasAnswered) return String.fromCharCode(65 + index);
    if (option === currentQuestion.correctAnswer) return '✓';
    if (option === selectedOption) return '✗';
    return String.fromCharCode(65 + index);
  };

  const getBadgeStyle = () => {
    if (!hasAnswered) return styles.badgeDefault;
    if (option === currentQuestion.correctAnswer) return styles.badgeCorrect;
    if (option === selectedOption && option !== currentQuestion.correctAnswer) return styles.badgeWrong;
    return styles.badgeDefault;
  };

  const getBadgeTextStyle = () => {
    if (!hasAnswered) return styles.badgeTextDefault;
    if (option === currentQuestion.correctAnswer) return styles.badgeTextCorrect;
    if (option === selectedOption && option !== currentQuestion.correctAnswer) return styles.badgeTextWrong;
    return styles.badgeTextDefault;
  };

  const onPress = useCallback(() => handleSelectOption(option), [handleSelectOption, option]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={hasAnswered}
      activeOpacity={0.8}
      style={[styles.optionBase, getOptionStyle()]}
    >
      <View style={[styles.optionBadge, getBadgeStyle()]}>
        <Text style={[styles.optionBadgeText, getBadgeTextStyle()]}>
          {getOptionIcon()}
        </Text>
      </View>
      <Text style={[styles.optionText, getOptionTextStyle()]}>{option}</Text>
    </TouchableOpacity>
  );
});

const QuizFlow: React.FC<QuizFlowProps> = React.memo(function QuizFlow({ questions, onQuizComplete, quizTopic, onAnswer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([...questions]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const percentage = (secondsLeft / SECONDS_PER_QUESTION) * 100;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    stopTimer();
    setHasAnswered(true);
    setAnsweredQuestions(prev => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], userAnswer: undefined };
      return updated;
    });
  }, [currentIndex, stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(SECONDS_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimeUp, stopTimer]);

  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    startTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleSelectOption = useCallback((option: string) => {
    if (hasAnswered) return;
    stopTimer();
    setSelectedOption(option);
    setHasAnswered(true);

    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) setScore(prev => prev + 1);

    setAnsweredQuestions(prev => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], userAnswer: option };
      return updated;
    });

    if (onAnswer) onAnswer(currentQuestion.id, option, currentQuestion);
  }, [hasAnswered, stopTimer, currentQuestion, currentIndex, onAnswer, answeredQuestions]);

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = score + (selectedOption === currentQuestion.correctAnswer && hasAnswered ? 0 : 0);
      onQuizComplete(score, answeredQuestions);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.topicText} numberOfLines={1}>{quizTopic}</Text>
        <View style={styles.questionCounter}>
          <Text style={styles.questionCounterText}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentIndex / questions.length) * 100}%` },
          ]}
        />
      </View>

      {/* Score tracker */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>
          Score: <Text style={styles.scoreValue}>{score}</Text>
        </Text>
        <Text style={styles.remainingText}>{questions.length - currentIndex - 1} left</Text>
      </View>

      {/* Timer */}
      <TimerBar secondsLeft={secondsLeft} totalSeconds={SECONDS_PER_QUESTION} percentage={percentage} />

      {/* Question card */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, i) => (
            <QuizOption
              key={i}
              option={option}
              index={i}
              hasAnswered={hasAnswered}
              currentQuestion={currentQuestion}
              selectedOption={selectedOption}
              handleSelectOption={handleSelectOption}
            />
          ))}
        </View>

        {hasAnswered && (
          <View style={styles.nextContainer}>
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'View Results →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
});

export default QuizFlow;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  questionCounter: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionCounterText: {
    color: '#64748b',
    fontSize: 11,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreText: {
    color: '#64748b',
    fontSize: 12,
  },
  scoreValue: {
    color: '#a855f7',
    fontWeight: '700',
  },
  remainingText: {
    color: '#64748b',
    fontSize: 12,
  },
  questionCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  questionText: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionDefault: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderColor: '#475569',
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  optionFaded: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderColor: '#1e293b',
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextDefault: {
    color: '#e2e8f0',
  },
  optionTextCorrect: {
    color: '#6ee7b7',
  },
  optionTextWrong: {
    color: '#fca5a5',
  },
  optionTextFaded: {
    color: '#64748b',
  },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeDefault: {
    borderColor: '#475569',
  },
  badgeCorrect: {
    borderColor: '#10b981',
  },
  badgeWrong: {
    borderColor: '#ef4444',
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextDefault: {
    color: '#64748b',
  },
  badgeTextCorrect: {
    color: '#10b981',
  },
  badgeTextWrong: {
    color: '#ef4444',
  },
  nextContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
  },
  nextButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
