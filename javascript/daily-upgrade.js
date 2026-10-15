  const tips = [
        "Read at least 10 minutes today to grow your mind.",
        "Write down one thing you learned today.",
        "Practice gratitude by listing 3 things you’re thankful for.",
        "Learn one new word daily to expand your vocabulary.",
        "Take a short walk to refresh your mind.",
        "Share knowledge with a friend — teaching reinforces learning.",
        "Reflect on your progress before bed tonight.",
        "Replace 10 minutes of scrolling with 10 minutes of reading.",
        "Drink water and stretch — your body fuels your mind.",
        "Challenge yourself with one new idea today.",
        "Listen to a podcast that inspires growth.",
        "Organize your workspace for clarity.",
        "Spend 5 minutes meditating to reset focus.",
        "Write down tomorrow’s top priority before bed.",
        "Compliment someone genuinely today.",
        "Practice patience — growth takes time.",
        "Limit distractions for one focused hour.",
        "Smile at yourself in the mirror.",
        "Learn something outside your comfort zone.",
        "Celebrate one small win today.",
        "Replace negative self-talk with encouragement.",
        "Take notes while reading to retain more.",
        "Practice deep breathing for calmness.",
        "Give yourself permission to rest.",
        "Ask one thoughtful question today.",
        "Reconnect with an old friend.",
        "Declutter one small area of your life.",
        "Visualize your goals for 5 minutes.",
        "Write down a dream you want to chase.",
        "End the day with gratitude.",
      ];

      // Pick a random tip each time the page loads
      document.getElementById("tip").innerText =
        tips[Math.floor(Math.random() * tips.length)];
    
