import React, { useState, useEffect } from 'react';

const StarTrail = () => {
  const [stars, setStars] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [prevMousePosition, setPrevMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (prevMousePosition.x === 0 && prevMousePosition.y === 0) {
      setPrevMousePosition(mousePosition);
      return;
    }

    // Calculate distance moved
    const dx = mousePosition.x - prevMousePosition.x;
    const dy = mousePosition.y - prevMousePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return; // Only create stars when there's significant movement

    // Create new stars
    const newStars = [];
    const numStars = Math.min(5, Math.floor(distance / 10));
    
    for (let i = 0; i < numStars; i++) {
      const ratio = i / numStars;
      const x = prevMousePosition.x + dx * ratio;
      const y = prevMousePosition.y + dy * ratio;
      
      newStars.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 40 + 200}, ${Math.random() * 30 + 70}%, ${Math.random() * 20 + 80}%)`
      });
    }

    setStars(prevStars => [...prevStars, ...newStars]);
    setPrevMousePosition(mousePosition);

    // Remove stars after they've animated
    const timer = setTimeout(() => {
      setStars(prevStars => prevStars.filter(star => !newStars.includes(star)));
    }, 1000);

    return () => clearTimeout(timer);
  }, [mousePosition, prevMousePosition]);

  return (
    <div className="star-trail-container">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color
          }}
        />
      ))}
    </div>
  );
};

export default StarTrail;