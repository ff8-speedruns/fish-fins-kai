import { useRef } from 'react';

// Kept from the original page: clicking Kaivel plays a random clip.
const CLIPS = [
  'ayayaya',
  'ahnonono',
  'cantsee',
  'cantseegame',
  'dontknowcalm',
  'dontknow',
  'laugh',
  'batman',
  'foudre',
  'ultima',
  'what',
  'whatareyoudoing',
  'allo',
];

export default function KaivelButton() {
  const audioRef = useRef(null);

  const play = () => {
    const clip = CLIPS[Math.floor(Math.random() * CLIPS.length)];
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = `${import.meta.env.BASE_URL}mp3/${clip}.mp3`;
    audio.play();
  };

  return (
    <>
      <img
        src={`${import.meta.env.BASE_URL}img/kaivel.png`}
        alt="Kaivel"
        className="kai-avatar"
        onClick={play}
      />
      <audio ref={audioRef} />
    </>
  );
}
