let isMuted = false;

export const setMute = (mute) => {
  isMuted = mute;
};

export const playSound = (soundFile) => {
  if (isMuted) return;
  const audio = new Audio(soundFile);
  audio.play().catch((error) => {
    console.error('Error playing sound:', error);
  });
};