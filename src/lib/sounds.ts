// Tactical Sound Effects Utility
const sounds = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  hover: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  scan: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',
  hum: 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3',
};

class SoundManager {
  private audio: HTMLAudioElement | null = null;

  play(type: keyof typeof sounds) {
    try {
      const audio = new Audio(sounds[type]);
      audio.volume = 0.2;
      audio.play().catch(() => {
        // Ignore autoplay restrictions
      });
    } catch (e) {
      console.error("Sound error", e);
    }
  }
}

export const soundManager = new SoundManager();
