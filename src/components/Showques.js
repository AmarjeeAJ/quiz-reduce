import React, { useEffect, useReducer, useCallback } from "react";
import {
  SET_QUESTIONS,
  SET_ERROR,
  SET_CURRENT_PAGE,
  SET_SELECTED_OPTION,
  SET_IS_CORRECT,
  SET_TOTAL_MARKS,
  SET_TIMER,
  SET_QUIZ_STARTED,
  SET_TOTAL_POSSIBLE_MARKS,
  SET_QUIZ_ENDED,
  RESTORE_STATE,
} from "../actions.js";


const initialState = {
  questions: [],
  error: null,
  currentPage: 0,
  selectedOption: null,
  isCorrect: null,
  totalMarks: 0,
  timer: 30,
  quizStarted: false,
  totalPossibleMarks: 0,
  quizEnded: false,
};


const reducer = (state, action) => {
  switch (action.type) {
    case SET_QUESTIONS:
      return {
        ...state,
        questions: action.payload.questions,
        totalPossibleMarks: action.payload.totalPossibleMarks,
      };
    case SET_ERROR:
      return { ...state, error: action.payload };
    case SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
    case SET_SELECTED_OPTION:
      return { ...state, selectedOption: action.payload };
    case SET_IS_CORRECT:
      return { ...state, isCorrect: action.payload };
    case SET_TOTAL_MARKS:
      return { ...state, totalMarks: state.totalMarks + action.payload };
    case SET_TIMER:
      return { ...state, timer: action.payload };
    case SET_QUIZ_STARTED:
      return { ...state, quizStarted: action.payload };
    case SET_TOTAL_POSSIBLE_MARKS:
      return { ...state, totalPossibleMarks: action.payload };
    case SET_QUIZ_ENDED:
      return { ...state, quizEnded: action.payload };
    case RESTORE_STATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const Showques = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  
  useEffect(() => {
    fetch("http://localhost:8000/questions")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const possibleMarks = data.reduce((sum, question) => sum + question.points, 0);
        dispatch({ type: SET_QUESTIONS, payload: { questions: data, totalPossibleMarks: possibleMarks } });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        dispatch({ type: SET_ERROR, payload: error.message });
      });
  }, []);


  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("quizState"));
    if (savedState) {
      dispatch({ type: RESTORE_STATE, payload: savedState });
    }
  }, []);

  
  useEffect(() => {
    if (state.quizStarted) {
      localStorage.setItem("quizState", JSON.stringify(state));
    }
  }, [state]);

  
  const handleNext = useCallback(() => {
    if (state.selectedOption !== null) {
      if (state.currentPage < state.questions.length - 1) {
        dispatch({ type: SET_CURRENT_PAGE, payload: state.currentPage + 1 });
      } else {
        dispatch({ type: SET_QUIZ_ENDED, payload: true });
      }
      dispatch({ type: SET_SELECTED_OPTION, payload: null });
      dispatch({ type: SET_IS_CORRECT, payload: null });
      dispatch({ type: SET_TIMER, payload: 30 });
    }
  }, [state]);

  
  useEffect(() => {
    if (state.quizStarted && !state.quizEnded) {
      const interval = setInterval(() => {
        dispatch({ type: SET_TIMER, payload: state.timer > 1 ? state.timer - 1 : 30 });
        if (state.timer <= 1) {
          handleNext();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.quizStarted, state.quizEnded, state.timer, handleNext]);

  
  const handleOptionSelect = (index) => {
    if (state.selectedOption !== null) return;

    dispatch({ type: SET_SELECTED_OPTION, payload: index });
    const question = state.questions[state.currentPage];

    if (question.correctOption === index) {
      dispatch({ type: SET_IS_CORRECT, payload: true });
      dispatch({ type: SET_TOTAL_MARKS, payload: question.points });
    } else {
      dispatch({ type: SET_IS_CORRECT, payload: false });
    }
  };

  
  const handlePrev = () => {
    dispatch({ type: SET_CURRENT_PAGE, payload: Math.max(state.currentPage - 1, 0) });
    dispatch({ type: SET_SELECTED_OPTION, payload: null });
    dispatch({ type: SET_IS_CORRECT, payload: null });
    dispatch({ type: SET_TIMER, payload: 30 });
  };

  
  const startQuiz = () => {
    dispatch({ type: SET_QUIZ_STARTED, payload: true });
    dispatch({ type: SET_QUIZ_ENDED, payload: false });
    dispatch({ type: SET_TOTAL_MARKS, payload: 0 });
    dispatch({ type: SET_CURRENT_PAGE, payload: 0 });
    dispatch({ type: SET_TIMER, payload: 30 });
    dispatch({ type: SET_SELECTED_OPTION, payload: null });
    dispatch({ type: SET_IS_CORRECT, payload: null });
  };

  const restartQuiz = () => {
    dispatch({ type: SET_QUIZ_STARTED, payload: false });
    dispatch({ type: SET_QUIZ_ENDED, payload: false });
    dispatch({ type: SET_TOTAL_MARKS, payload: 0 });
    dispatch({ type: SET_CURRENT_PAGE, payload: 0 });
    dispatch({ type: SET_TIMER, payload: 30 });
    dispatch({ type: SET_SELECTED_OPTION, payload: null });
    dispatch({ type: SET_IS_CORRECT, payload: null });
    localStorage.removeItem("quizState");
  };

  return (
    <div className="p-4">
      
      {!state.quizStarted ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={startQuiz}
            className="w-40 h-40 bg-red-600 text-white rounded-full text-xl flex items-center justify-center font-serif"
          >
            Start
          </button>
        </div>
      ) : state.quizEnded ? (
        <div className="w-[580px] mx-auto mb-4 p-6 px-2 py-2 border rounded shadow-sm text-center">
          <h2 className="text-xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-lg mb-4">Your Score: {state.totalMarks}/{state.totalPossibleMarks}</p>
          <button
            onClick={restartQuiz}
            className="px-6 py-2 bg-blue-500 text-white rounded-full"
          >
            Restart Quiz
          </button>
        </div>
      ) : (
        state.questions.length > 0 && (
          <div>
            <div className="w-[580px] mx-auto mb-4 p-6 px-4 py-2 border rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-bold px-2">Your Score: {state.totalMarks}/{state.totalPossibleMarks}</p>
                <p className="text-lg font-bold">Time Left: {state.timer}s</p>
              </div>
              <h2 className="text-xl font-bold mb-2">
                Question {state.currentPage + 1} of {state.questions.length}
              </h2>
              <h3 className="text-lg mb-4">{state.questions[state.currentPage].question}</h3>
              <ul className="list-none list-inside">
                {state.questions[state.currentPage].options.map((option, index) => (
                  <li
                    key={index}
                    className={`mb-3 px-2 py-2 rounded-lg cursor-pointer ${
                      state.selectedOption !== null && state.selectedOption === index
                        ? state.isCorrect
                          ? "bg-green-400"
                          : "bg-red-400"
                        : state.selectedOption !== null
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gray-200"
                    }`}
                    onClick={() => handleOptionSelect(index)}
                    style={{ pointerEvents: state.selectedOption !== null ? "none" : "auto" }}
                  >
                    {index + 1}. {option}
                  </li>
                ))}
              </ul>
              <p className="mt-2 px-1 py-1 font-bold">
                Marks for this Question: {state.questions[state.currentPage].points}
              </p>
            </div>
            <div className="flex justify-around py-4 px-5 mt-4">
              <button
                onClick={handlePrev}
                disabled={state.currentPage === 0}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={state.selectedOption === null}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300"
              >
                {state.currentPage < state.questions.length - 1 ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Showques;
