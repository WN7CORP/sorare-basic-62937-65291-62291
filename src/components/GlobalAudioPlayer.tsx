import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAmbientSound } from "@/contexts/AmbientSoundContext";
import SpotifyLikePlayer from "./SpotifyLikePlayer";

const GlobalAudioPlayer = () => {
  const { currentAudio, closePlayer } = useAudioPlayer();
  const { stopSound } = useAmbientSound();

  const handleClose = () => {
    stopSound();
    closePlayer();
  };

  if (!currentAudio) return null;

  return (
    <SpotifyLikePlayer
      isOpen={!!currentAudio}
      onClose={handleClose}
      audioUrl={currentAudio.url_audio}
      title={currentAudio.titulo}
      area={currentAudio.area}
      tema={currentAudio.tema}
      descricao={currentAudio.descricao}
      imagem_miniatura={currentAudio.imagem_miniatura}
    />
  );
};

export default GlobalAudioPlayer;
