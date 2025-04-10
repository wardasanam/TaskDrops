import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import './App.css';

const GoalInput = memo(({ goal, setGoal, goalType, setGoalType, addGoal, showEmptyGoalMessage }) => {
  const inputRef = useRef(null);

  return (
    <div className="input-container" ref={inputRef}>
      <input
        type="text"
        placeholder="enter your goal"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <select value={goalType} onChange={(e) => setGoalType(e.target.value)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="long-term">Long-term</option>
      </select>
      <button onClick={addGoal}>Add</button>
    </div>
  );
});

const GoalCircle = memo(({ g, colors, getDustbinPosition, removeGoal, updateGoalPosition, completeGoal }) => {
  const controls = useAnimation();
  const dropletControls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const positionRef = useRef({ x: g.x, y: g.y });
  const dragRef = useRef(false);
  const clickTimeoutRef = useRef(null);
  const dragTimeoutRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragTimeoutRef.current = setTimeout(() => {
      dragRef.current = true;
      setIsDragging(true);
    }, 200);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    if (!dragRef.current) {
      setClickCount((prev) => prev + 1);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => setClickCount(0), 300);
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    console.log('Double-click triggered for goal:', g.id);
    dropletControls.start((i) => ({
      scale: i === 'ring' ? 2 : 1,
      opacity: 0,
      transition: { duration: i === 'ring' ? 0.4 : 0.5, ease: 'easeOut' },
      ...(i !== 'ring' && { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 }),
    }));
    controls.start({
      scale: 1.1,
      opacity: 0,
      boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
      transition: { duration: 0.3, ease: 'easeOut' },
    }).then(() => {
      console.log('Animation completed for goal:', g.id);
      setTimeout(() => completeGoal(g.id), 300);
    });
  }, [g.id, controls, dropletControls, completeGoal]);

  useEffect(() => {
    if (clickCount === 2 && !dragRef.current) {
      handleDoubleClick();
      setClickCount(0);
    }
  }, [clickCount, handleDoubleClick]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setClickCount(0);
  }, []);

  const handleDragEnd = useCallback((event, info) => {
    dragRef.current = false;
    setIsDragging(false);
    let newX = positionRef.current.x + info.offset.x;
    let newY = positionRef.current.y + info.offset.y;
    const circleSize = g.size;

    newX = Math.max(0, Math.min(newX, window.innerWidth - circleSize));
    newY = Math.max(0, Math.min(newY, window.innerHeight - circleSize));

    updateGoalPosition(g.id, newX, newY);
  }, [g.id, g.size, updateGoalPosition]);

  return (
    <motion.div
      key={g.id}
      className={`goal-circle ${g.type} ${g.completed ? 'completed' : ''}`}
      style={{
        backgroundColor: colors[g.type],
        width: g.size,
        height: g.size,
        zIndex: 5,
      }}
      initial={{ y: -100, x: g.x, scale: 0.5, borderRadius: '50%' }}
      animate={g.isNew ? { y: g.y, x: g.x, scale: 1, borderRadius: '50%' } : { x: g.x, y: g.y, scale: 1, borderRadius: '50%' }}
      transition={g.isNew ? { duration: 1, ease: 'easeOut' } : {}}
      drag={isDragging}
      dragElastic={0.3}
      dragConstraints={{ left: 0, right: window.innerWidth - g.size, top: 0, bottom: window.innerHeight - g.size }}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="goal-content">
        <motion.div
          className="ripple"
          initial={g.isNew ? { scale: 0, opacity: 1 } : false}
          animate={g.isNew ? { scale: 2, opacity: 0 } : false}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        <motion.div
          className="burst-ring"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={dropletControls}
          custom="ring"
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <span style={{ fontSize: clamp(12, g.size / 5, 24), textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{g.text}</span>
      </div>
      <div className="hover-message">Double click to remove</div>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="droplet"
          initial={{ scale: 0 }}
          animate={dropletControls}
          custom={i}
        />
      ))}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  const colorsEqual = prevProps.colors[nextProps.g.type] === nextProps.colors[nextProps.g.type];
  return (
    prevProps.g.id === nextProps.g.id &&
    prevProps.g.x === nextProps.g.x &&
    prevProps.g.y === nextProps.g.y &&
    prevProps.g.text === nextProps.g.text &&
    prevProps.g.completed === nextProps.g.completed &&
    prevProps.g.size === nextProps.g.size &&
    prevProps.g.isNew === nextProps.g.isNew &&
    colorsEqual &&
    prevProps.getDustbinPosition === nextProps.getDustbinPosition &&
    prevProps.removeGoal === nextProps.removeGoal &&
    prevProps.updateGoalPosition === nextProps.updateGoalPosition &&
    prevProps.completeGoal === nextProps.completeGoal
  );
});

const GoalsContainer = memo(({ goalsList, colors, getDustbinPosition, removeGoal, updateGoalPosition, completeGoal }) => {
  return (
    <AnimatePresence>
      {goalsList.map((g) => (
        <GoalCircle
          key={g.id}
          g={g}
          colors={colors}
          getDustbinPosition={getDustbinPosition}
          removeGoal={removeGoal}
          updateGoalPosition={updateGoalPosition}
          completeGoal={completeGoal}
        />
      ))}
    </AnimatePresence>
  );
});

function App() {
  const [goal, setGoal] = useState('');
  const [goalType, setGoalType] = useState('daily');
  const [goalsList, setGoalsList] = useState([]);
  const [completedGoalsList, setCompletedGoalsList] = useState([]);
  const authPromptRef = useRef(null);
  const colorPatternRef = useRef(null);
  const backgroundOptionsRef = useRef(null);
  const dashboardToggleRef = useRef(null);
  const dustbinRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const [colors, setColors] = useState({
    daily: 'rgb(3, 136, 252)',
    weekly: 'rgb(158, 36, 140)',
    'long-term': 'rgb(115, 50, 227)',
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState({});
  const [authError, setAuthError] = useState('');

  const [background, setBackground] = useState({
    type: 'image',
    value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  });
  const [solidColor, setSolidColor] = useState('#87CEEB');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [showEmptyGoalMessage, setShowEmptyGoalMessage] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showActiveGoals, setShowActiveGoals] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalText, setEditGoalText] = useState('');
  const [editGoalType, setEditGoalType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showColorOptions, setShowColorOptions] = useState(false);

  const themeOptions = [
    {
      label: 'Air',
      value: '/images/air-theme.jpg',
      type: 'image',
    },
    {
      label: 'Water',
      value: '/images/water-theme.jpg',
      type: 'image',
    },
    {
      label: 'Fire',
      value: '/images/fire-theme.jpg',
      type: 'image',
    },
    {
      label: 'Earth',
      value: '/images/earth-theme.jpg',
      type: 'image',
    },
  ];

  useEffect(() => {
    if (background.type === 'image') {
      const img = new Image();
      img.src = background.value;
      img.onload = () => {
        console.log(`Image loaded successfully: ${background.value}`);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${background.value}`);
      };
    }
  }, [background]);

  useEffect(() => {
    console.log('Current background:', background);
  }, [background]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (backgroundOptionsRef.current && !backgroundOptionsRef.current.contains(event.target)) {
        setShowThemeOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const handleColorChange = useCallback((type, newColor) => {
    setColors((prevColors) => ({
      ...prevColors,
      [type]: newColor,
    }));
  }, []);

  const handleThemeChange = useCallback((option) => {
    setBackground({ type: option.type, value: option.value });
    setShowThemeOptions(false);
  }, []);

  const addGoal = () => {
    if (!goal.trim()) {
      setShowEmptyGoalMessage(true);
      return;
    }

    const safeZonePadding = 50;
    const safeZones = [];

    const addSafeZone = (ref) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        safeZones.push({
          x: rect.left - safeZonePadding,
          y: rect.top - safeZonePadding,
          width: rect.width + 2 * safeZonePadding,
          height: rect.height + 2 * safeZonePadding,
        });
      }
    };

    addSafeZone(authPromptRef);
    addSafeZone(colorPatternRef);
    addSafeZone(backgroundOptionsRef);
    if (isLoggedIn) addSafeZone(dashboardToggleRef);
    addSafeZone(dustbinRef);

    const minSize = 100;
    const maxSize = 3000;
    const baseSizePerChar = 2;
    const words = goal.split(' ').length;
    const sizePerChar = baseSizePerChar * (words > 1 ? 1.3 : 1);
    const calculatedSize = minSize + goal.length * sizePerChar;
    const circleSize = Math.min(maxSize, Math.max(minSize, calculatedSize));

    let newX, newY;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      newX = Math.random() * (window.innerWidth - circleSize);
      newY = Math.random() * (window.innerHeight - circleSize);

      const overlapsSafeZone = safeZones.some((zone) => (
        newX + circleSize > zone.x &&
        newX < zone.x + zone.width &&
        newY + circleSize > zone.y &&
        newY < zone.y + zone.height
      ));

      const overlapsExisting = goalsList.some((g) => {
        const dx = newX - g.x;
        const dy = newY - g.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circleSize + g.size) / 2 + 20;
      });

      if (!overlapsSafeZone && !overlapsExisting) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      newX = Math.random() * (window.innerWidth - circleSize);
      newY = window.innerHeight - circleSize - 10;
    }

    const newGoal = {
      text: goal,
      type: goalType,
      id: Date.now() + Math.random(),
      x: newX,
      y: newY,
      size: circleSize,
      completed: false,
      isNew: true,
    };

    setGoalsList((prevGoals) => [...prevGoals, newGoal]);

    if (isLoggedIn && username) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: {
          ...prevUsers[username],
          goals: [...(prevUsers[username]?.goals || []), newGoal],
        },
      }));
    }

    setGoal('');
    setShowEmptyGoalMessage(false);
  };

  const removeGoal = useCallback((id) => {
    setGoalsList((prevGoals) => prevGoals.filter((g) => g.id !== id));
    if (isLoggedIn && username) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: {
          ...prevUsers[username],
          goals: prevUsers[username]?.goals.filter((g) => g.id !== id) || [],
        },
      }));
    }
  }, [isLoggedIn, username]);

  const completeGoal = useCallback((id) => {
    const goal = goalsList.find((g) => g.id === id);
    if (goal) {
      console.log('Completing goal:', goal);
      const completedGoal = { ...goal, completed: true, isNew: false };
      setCompletedGoalsList((prev) => {
        const newCompletedGoals = [...prev, completedGoal];
        if (isLoggedIn && username) {
          setUsers((prevUsers) => ({
            ...prevUsers,
            [username]: {
              ...prevUsers[username],
              completedGoals: newCompletedGoals,
            },
          }));
        }
        return newCompletedGoals;
      });
      removeGoal(id);
    } else {
      console.log('Goal not found for id:', id);
    }
  }, [goalsList, removeGoal, isLoggedIn, username]);

  const updateGoalPosition = useCallback((id, newX, newY) => {
    const safeZonePadding = 50;
    const safeZones = [];

    const addSafeZone = (ref) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        safeZones.push({
          x: rect.left - safeZonePadding,
          y: rect.top - safeZonePadding,
          width: rect.width + 2 * safeZonePadding,
          height: rect.height + 2 * safeZonePadding,
        });
      }
    };

    addSafeZone(authPromptRef);
    addSafeZone(colorPatternRef);
    addSafeZone(backgroundOptionsRef);
    if (isLoggedIn) addSafeZone(dashboardToggleRef);

    const goal = goalsList.find((g) => g.id === id);
    if (!goal) return;
    const circleSize = goal.size;

    const overlapsSafeZone = safeZones.some((zone) => (
      newX + circleSize > zone.x &&
      newX < zone.x + zone.width &&
      newY + circleSize > zone.y &&
      newY < zone.y + zone.height
    ));

    const overlapsExisting = goalsList.some((otherGoal) => {
      if (otherGoal.id === id) return false;
      const dx = newX - otherGoal.x;
      const dy = newY - otherGoal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (circleSize + otherGoal.size) / 2 + 20;
    });

    let droppedInDustbin = false;
    if (dustbinRef.current) {
      const dustbinRect = dustbinRef.current.getBoundingClientRect();
      const dustbinZone = {
        x: dustbinRect.left - safeZonePadding,
        y: dustbinRect.top - safeZonePadding,
        width: dustbinRect.width + 2 * safeZonePadding,
        height: dustbinRect.height + 2 * safeZonePadding,
      };

      droppedInDustbin =
        newX + circleSize > dustbinZone.x &&
        newX < dustbinZone.x + dustbinZone.width &&
        newY + circleSize > dustbinZone.y &&
        newY < dustbinZone.y + dustbinZone.height;
    }

    if (droppedInDustbin) {
      completeGoal(id);
      return;
    }

    if (overlapsSafeZone || overlapsExisting) {
      return;
    }

    newX = Math.max(0, Math.min(newX, window.innerWidth - circleSize));
    newY = Math.max(0, Math.min(newY, window.innerHeight - circleSize));

    setGoalsList((prevGoals) =>
      prevGoals.map((g) =>
        g.id === id ? { ...g, x: newX, y: newY, isNew: false } : g
      )
    );

    if (isLoggedIn && username) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: {
          ...prevUsers[username],
          goals: prevUsers[username]?.goals.map((g) =>
            g.id === id ? { ...g, x: newX, y: newY, isNew: false } : g
          ) || [],
        },
      }));
    }
  }, [goalsList, isLoggedIn, username, completeGoal]);

  const deleteCompletedGoal = useCallback((id) => {
    setCompletedGoalsList((prev) => {
      const newCompletedGoals = prev.filter((g) => g.id !== id);
      if (isLoggedIn && username) {
        setUsers((prevUsers) => ({
          ...prevUsers,
          [username]: {
            ...prevUsers[username],
            completedGoals: newCompletedGoals,
          },
        }));
      }
      return newCompletedGoals;
    });
  }, [isLoggedIn, username]);

  const resetDashboard = useCallback(() => {
    setGoalsList([]);
    setCompletedGoalsList([]);
    if (isLoggedIn && username) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: {
          ...prevUsers[username],
          goals: [],
          completedGoals: [],
        },
      }));
    }
  }, [isLoggedIn, username]);

  const handleAuth = useCallback((e) => {
    e.preventDefault();
    setAuthError('');

    if (isSignup) {
      if (users[username]) {
        setAuthError('Username already exists! Please choose a different username.');
        return;
      }
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: { password, goals: goalsList, completedGoals: completedGoalsList },
      }));
      setIsLoggedIn(true);
      setShowAuthForm(false);
    } else {
      if (users[username] && users[username].password === password) {
        setIsLoggedIn(true);
        setShowAuthForm(false);
        const userGoals = users[username].goals || [];
        const userCompletedGoals = users[username].completedGoals || [];
        setGoalsList(userGoals);
        setCompletedGoalsList(userCompletedGoals);
      } else {
        setAuthError('Invalid username or password!');
      }
    }
  }, [isSignup, users, username, password, goalsList, completedGoalsList]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setGoalsList([]);
    setCompletedGoalsList([]);
    setShowDashboard(false);
  }, []);

  const getDustbinPosition = useCallback(() => {
    if (dustbinRef.current) {
      const rect = dustbinRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth - 50, y: window.innerHeight - 50 };
  }, []);

  const startEditingGoal = (goal) => {
    setEditingGoal(goal.id);
    setEditGoalText(goal.text);
    setEditGoalType(goal.type);
  };

  const saveEditedGoal = (id) => {
    if (!editGoalText.trim()) {
      alert("Goal text cannot be empty!");
      return;
    }

    setGoalsList((prevGoals) =>
      prevGoals.map((g) =>
        g.id === id ? { ...g, text: editGoalText, type: editGoalType } : g
      )
    );

    if (isLoggedIn && username) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [username]: {
          ...prevUsers[username],
          goals: prevUsers[username]?.goals.map((g) =>
            g.id === id ? { ...g, text: editGoalText, type: editGoalType } : g
          ) || [],
        },
      }));
    }

    setEditingGoal(null);
    setEditGoalText('');
    setEditGoalType('');
  };

  const cancelEditingGoal = () => {
    setEditingGoal(null);
    setEditGoalText('');
    setEditGoalType('');
  };

  const confirmDeleteGoal = (id) => {
    setShowDeleteConfirm(id);
  };

  const handleDeleteGoal = (id) => {
    removeGoal(id);
    setShowDeleteConfirm(null);
  };

  const totalGoals = goalsList.length + completedGoalsList.length;
  const completedGoals = completedGoalsList.length;
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  const goalsByType = {
    daily: goalsList.filter((g) => g.type === 'daily').length + completedGoalsList.filter((g) => g.type === 'daily').length,
    weekly: goalsList.filter((g) => g.type === 'weekly').length + completedGoalsList.filter((g) => g.type === 'weekly').length,
    'long-term': goalsList.filter((g) => g.type === 'long-term').length + completedGoalsList.filter((g) => g.type === 'long-term').length,
  };

  return (
    <div
      className="App"
      data-background-type={background.type}
      style={{
        background: background.type === 'image' ? `url(${background.value})` : background.value,
      }}
    >
      <div className={`main-content ${showAuthForm || showDashboard || showCompletedGoals || showEmptyGoalMessage || showActiveGoals || showDeleteConfirm ? 'blurred' : ''}`}>
        <div className="auth-prompt" ref={authPromptRef}>
          {isLoggedIn ? (
            <span onClick={handleLogout}>Logout</span>
          ) : (
            <span onClick={() => setShowAuthForm(true)}>Login to save your goals</span>
          )}
        </div>

        <div className="button-group">
          <div
            className="background-options"
            ref={backgroundOptionsRef}
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
              }
              setShowThemeOptions(true);
            }}
            onMouseLeave={() => {
              closeTimeoutRef.current = setTimeout(() => {
                setShowThemeOptions(false);
              }, 200);
            }}
          >
            <button>
              <span className="icon">🌈</span> Theme
            </button>
            {showThemeOptions && (
              <motion.div
                className="theme-options"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                  }
                  setShowThemeOptions(true);
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(() => {
                    setShowThemeOptions(false);
                  }, 200);
                }}
              >
                {themeOptions.map((option) => (
                  <div
                    key={option.value}
                    className="theme-option"
                    onClick={() => handleThemeChange(option)}
                  >
                    {option.label}
                  </div>
                ))}
                <hr className="theme-divider" />
                <div className="color-picker">
                  <label>Solid Color:</label>
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => {
                      setSolidColor(e.target.value);
                      setBackground({ type: "color", value: e.target.value });
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div
            className="color-pattern"
            ref={colorPatternRef}
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
              }
              setShowColorOptions(true);
            }}
            onMouseLeave={() => {
              closeTimeoutRef.current = setTimeout(() => {
                setShowColorOptions(false);
              }, 200);
            }}
          >
            <button>
              <span className="icon">🎨</span> Color
            </button>
            {showColorOptions && (
              <motion.div
                className="color-pickers"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="color-picker">
                  <label>Daily:</label>
                  <input
                    type="color"
                    value={colors.daily}
                    onChange={(e) => handleColorChange("daily", e.target.value)}
                  />
                </div>
                <div className="color-picker">
                  <label>Weekly:</label>
                  <input
                    type="color"
                    value={colors.weekly}
                    onChange={(e) => handleColorChange("weekly", e.target.value)}
                  />
                </div>
                <div className="color-picker">
                  <label>Long-term:</label>
                  <input
                    type="color"
                    value={colors["long-term"]}
                    onChange={(e) => handleColorChange("long-term", e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {isLoggedIn && (
          <div className="dashboard-toggle" ref={dashboardToggleRef}>
            <button onClick={() => setShowDashboard(true)}>Show Dashboard</button>
          </div>
        )}

        <GoalInput
          goal={goal}
          setGoal={setGoal}
          goalType={goalType}
          setGoalType={setGoalType}
          addGoal={addGoal}
          showEmptyGoalMessage={showEmptyGoalMessage}
        />

        <div className="dustbin" ref={dustbinRef}>
          <button onClick={() => setShowCompletedGoals(true)}>🗑️</button>
          <button onClick={() => setShowActiveGoals(true)} style={{ marginLeft: '10px' }}>
            📋 Active Goals
          </button>
        </div>

        <GoalsContainer
          goalsList={goalsList}
          colors={colors}
          getDustbinPosition={getDustbinPosition}
          removeGoal={removeGoal}
          updateGoalPosition={updateGoalPosition}
          completeGoal={completeGoal}
        />
      </div>

      {showDashboard && isLoggedIn && (
        <div className="dashboard">
          <button className="close-button" onClick={() => setShowDashboard(false)}>
            ✕
          </button>
          <h2>Goal Statistics</h2>
          <div className="stats">
            <p>Total Goals: {totalGoals}</p>
            <p>Completed Goals: {completedGoals}</p>
            <p>Completion Rate: {completionRate.toFixed(2)}%</p>
            <p>Daily Goals: {goalsByType.daily}</p>
            <p>Weekly Goals: {goalsByType.weekly}</p>
            <p>Long-term Goals: {goalsByType['long-term']}</p>
          </div>
          <button
            className="reset-dashboard-button"
            onClick={resetDashboard}
          >
            Reset Dashboard
          </button>
        </div>
      )}

      {showCompletedGoals && (
        <div className="completed-goals-modal">
          <button className="close-button" onClick={() => setShowCompletedGoals(false)}>
            ✕
          </button>
          <h2>Completed Goals</h2>
          <div className="completed-goals-list">
            {completedGoalsList.length === 0 ? (
              <p>No completed goals yet.</p>
            ) : (
              completedGoalsList.map((g) => (
                <div key={g.id} className="completed-goal-item">
                  <span>{g.text}</span>
                  <span>({g.type})</span>
                  <button
                    className="delete-goal-button"
                    onClick={() => deleteCompletedGoal(g.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          {completedGoalsList.length > 0 && (
            <button
              className="clear-all-button"
              onClick={() => {
                console.log('Clearing all completed goals');
                setCompletedGoalsList([]);
                if (isLoggedIn && username) {
                  setUsers((prevUsers) => ({
                    ...prevUsers,
                    [username]: {
                      ...prevUsers[username],
                      completedGoals: [],
                    },
                  }));
                }
              }}
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                background: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {showActiveGoals && (
        <div className="active-goals-modal">
          <button className="close-button" onClick={() => setShowActiveGoals(false)}>
            ✕
          </button>
          <h2>Active Goals</h2>
          <div className="active-goals-list">
            {goalsList.length === 0 ? (
              <p>No active goals yet.</p>
            ) : (
              goalsList.map((g) => (
                <div key={g.id} className="active-goal-item">
                  {editingGoal === g.id ? (
                    <div className="edit-goal-form">
                      <input
                        type="text"
                        value={editGoalText}
                        onChange={(e) => setEditGoalText(e.target.value)}
                        placeholder="Edit goal text"
                      />
                      <select
                        value={editGoalType}
                        onChange={(e) => setEditGoalType(e.target.value)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="long-term">Long-term</option>
                      </select>
                      <button onClick={() => saveEditedGoal(g.id)}>Save</button>
                      <button onClick={cancelEditingGoal}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span>{g.text}</span>
                      <span>({g.type})</span>
                      <button
                        className="edit-goal-button"
                        onClick={() => startEditingGoal(g)}
                      >
                        Edit
                      </button>
                      <button
                        className="complete-goal-button"
                        onClick={() => completeGoal(g.id)}
                      >
                        Mark as Completed
                      </button>
                      <button
                        className="delete-goal-button"
                        onClick={() => confirmDeleteGoal(g.id)}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete this goal?</p>
          <button
            onClick={() => handleDeleteGoal(showDeleteConfirm)}
            style={{ background: '#ff4444', color: '#fff', marginRight: '10px' }}
          >
            Yes, Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(null)}
            style={{ background: '#666', color: '#fff' }}
          >
            Cancel
          </button>
        </div>
      )}

      {showAuthForm && !isLoggedIn && (
        <div className="auth-form">
          <button className="close-button" onClick={() => setShowAuthForm(false)}>
            ✕
          </button>
          <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
          {authError && <p className="auth-error">{authError}</p>}
          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
            <button type="button" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Switch to Login' : 'Switch to Sign Up'}
            </button>
          </form>
        </div>
      )}

      {showEmptyGoalMessage && (
        <div className="empty-goal-modal">
          <button className="close-button" onClick={() => setShowEmptyGoalMessage(false)}>
            ✕
          </button>
          <h2>Oops!</h2>
          <p>Please enter a goal. It can't be empty! 🌟</p>
        </div>
      )}
    </div>
  );
}

const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

export default App;