// AudioManager - Gestion Audio OBS
'use strict';

const logger = require('../utils/logger');

class AudioManager {
  constructor(obsController) {
    this.obs = obsController;
  }

  // Aplicar filtros de audio por defecto a todas las fuentes
  async applyDefaultFilters() {
    if (!this.obs.connected) return;

    try {
      const inputs = await this.obs.call('GetInputList');
      const audioInputs = (inputs.inputs || []).filter(
        (i) => i.inputKind?.includes('audio') || 
                i.inputKind?.includes('mic') ||
                i.inputKind?.includes('capture')
      );

      for (const input of audioInputs) {
        await this.applyAudioFilters(input.inputName);
      }
      
      logger.info(`Filtros de audio aplicados a ${audioInputs.length} fuente(s)`);
    } catch (err) {
      logger.warn('No se pudieron aplicar filtros de audio:', err.message);
    }
  }

  async applyAudioFilters(sourceName) {
    const filters = [];

    // 1. Noise Suppression (RNNoise)
    if (process.env.AUDIO_NOISE_SUPPRESSION !== 'false') {
      filters.push({
        filterName: 'MS_NoiseSuppression',
        filterKind: 'noise_suppress_filter_v2',
        filterSettings: {
          method: 'rnnoise',
          suppress_level: -30,
        },
      });
    }

    // 2. Noise Gate
    if (process.env.AUDIO_NOISE_GATE !== 'false') {
      filters.push({
        filterName: 'MS_NoiseGate',
        filterKind: 'noise_gate_filter',
        filterSettings: {
          open_threshold: -26.0,
          close_threshold: -32.0,
          attack_time: 25,
          hold_time: 200,
          release_time: 150,
        },
      });
    }

    // 3. Compressor
    if (process.env.AUDIO_COMPRESSOR !== 'false') {
      filters.push({
        filterName: 'MS_Compressor',
        filterKind: 'compressor_filter',
        filterSettings: {
          ratio: 4.0,
          threshold: -18.0,
          attack_time: 3,
          release_time: 100,
          output_gain: 0.0,
        },
      });
    }

    // 4. Limiter para normalización
    const targetDb = parseFloat(process.env.AUDIO_TARGET_DB) || -12;
    filters.push({
      filterName: 'MS_Limiter',
      filterKind: 'limiter_filter',
      filterSettings: {
        threshold: targetDb,
        release_time: 60,
      },
    });

    // Aplicar cada filtro
    for (const filter of filters) {
      try {
        // Intentar eliminar filtro existente primero
        await this.obs.call('RemoveSourceFilter', {
          sourceName,
          filterName: filter.filterName,
        }).catch(() => {});

        await this.obs.call('CreateSourceFilter', {
          sourceName,
          ...filter,
        });
        
        logger.debug(`Filtro ${filter.filterName} aplicado a ${sourceName}`);
      } catch (err) {
        logger.debug(`No se pudo aplicar ${filter.filterName}: ${err.message}`);
      }
    }
  }

  async setMute(sourceName, muted) {
    try {
      await this.obs.call('SetInputMute', { inputName: sourceName, inputMuted: muted });
      logger.info(`${sourceName}: ${muted ? 'silenciado' : 'activado'}`);
      return { success: true, sourceName, muted };
    } catch (err) {
      logger.error('Error controlando mute:', err.message);
      throw err;
    }
  }

  async setVolume(sourceName, volumeDb) {
    // volumeDb: -100 (silencio) a 0 (máximo)
    const clampedDb = Math.max(-100, Math.min(0, volumeDb));
    try {
      await this.obs.call('SetInputVolume', {
        inputName: sourceName,
        inputVolumeDb: clampedDb,
      });
      return { success: true, sourceName, volumeDb: clampedDb };
    } catch (err) {
      logger.error('Error ajustando volumen:', err.message);
      throw err;
    }
  }

  async getInputSources() {
    try {
      const result = await this.obs.call('GetInputList');
      const inputs = result.inputs || [];
      
      // Obtener estado de cada input
      const detailed = await Promise.all(
        inputs.map(async (input) => {
          try {
            const muteState = await this.obs.call('GetInputMute', { inputName: input.inputName });
            const volume = await this.obs.call('GetInputVolume', { inputName: input.inputName });
            return {
              ...input,
              muted: muteState.inputMuted,
              volumeDb: Math.round(volume.inputVolumeDb),
            };
          } catch {
            return input;
          }
        })
      );

      return detailed;
    } catch (err) {
      logger.error('Error obteniendo fuentes de audio:', err.message);
      return [];
    }
  }

  async getAudioLevels() {
    // Para niveles en tiempo real se usa el evento InputVolumeMeters de OBS WebSocket
    // Este método retorna los niveles actuales
    try {
      const sources = await this.getInputSources();
      return sources.map((s) => ({
        name: s.inputName,
        muted: s.muted || false,
        volumeDb: s.volumeDb || -60,
      }));
    } catch {
      return [];
    }
  }
}

module.exports = AudioManager;
