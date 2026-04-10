// SceneManager - Control Escenas OBS
'use strict';

const logger = require('../utils/logger');

const DEFAULT_SCENES = [
  { name: 'Intro',          description: 'Pantalla de inicio con logo y música' },
  { name: 'Cámara Principal', description: 'Vista frontal del presentador' },
  { name: 'Pantalla Compartida', description: 'Captura de pantalla + cámara pequeña' },
  { name: 'Intermission',   description: 'Pantalla de pausa / break' },
  { name: 'Outro',          description: 'Pantalla de cierre' },
];

class SceneManager {
  constructor(obsController) {
    this.obs = obsController;
    this.currentScene = null;
    this.sceneHistory = [];
  }

  async initDefaultScenes() {
    if (!this.obs.connected) return;
    try {
      const existing = await this.getSceneList();
      const existingNames = existing.map((s) => s.sceneName || s.name);

      for (const scene of DEFAULT_SCENES) {
        if (!existingNames.includes(scene.name)) {
          await this.obs.call('CreateScene', { sceneName: scene.name }).catch(() => {});
          logger.debug(`Escena creada: ${scene.name}`);
        }
      }
      logger.info('Escenas por defecto inicializadas');
    } catch (err) {
      logger.warn('No se pudieron inicializar escenas:', err.message);
    }
  }

  async switchToScene(sceneName) {
    if (!this.obs.connected) throw new Error('OBS no conectado');
    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName });
      this.sceneHistory.push({ scene: this.currentScene, time: new Date() });
      this.currentScene = sceneName;
      logger.info(`Escena cambiada a: ${sceneName}`);
      return { success: true, scene: sceneName };
    } catch (err) {
      logger.error('Error cambiando escena:', err.message);
      throw err;
    }
  }

  async getSceneList() {
    try {
      const result = await this.obs.call('GetSceneList');
      return result.scenes || [];
    } catch {
      return DEFAULT_SCENES.map((s) => ({ sceneName: s.name, description: s.description }));
    }
  }

  async getCurrentScene() {
    try {
      const result = await this.obs.call('GetCurrentProgramScene');
      this.currentScene = result.currentProgramSceneName;
      return this.currentScene;
    } catch {
      return this.currentScene;
    }
  }

  getDefaultScenes() {
    return DEFAULT_SCENES;
  }
}

module.exports = SceneManager;
