import { Logger } from '../../../shared/utils/Logger.js';

export class TestController {
    constructor(mockService) {
        this.mockService = mockService;
    }

    startMock(req, res) {
        try {
            const config = req.body || {};
            const result = this.mockService.start(config);

            Logger.info('Mock iniciado via API', { config });
            res.json(result);
        } catch (error) {
            Logger.error('Erro ao iniciar mock via API', { error: error.message });
            res.status(500).json({ error: 'Falha ao iniciar mock', details: error.message });
        }
    }

    stopMock(req, res) {
        try {
            const result = this.mockService.stop();

            Logger.info('Mock parado via API');
            res.json(result);
        } catch (error) {
            Logger.error('Erro ao parar mock via API', { error: error.message });
            res.status(500).json({ error: 'Falha ao parar mock', details: error.message });
        }
    }

    getMockStatus(req, res) {
        try {
            const status = this.mockService.getStatus();
            res.json(status);
        } catch (error) {
            Logger.error('Erro ao obter status do mock', { error: error.message });
            res.status(500).json({ error: 'Falha ao obter status' });
        }
    }

    generateSpecificEvent(req, res) {
        try {
            const { type, platform } = req.params;
            const options = req.body || {};

            const result = this.mockService.generateSpecificEvent(type, platform, options);

            Logger.info('Evento específico gerado via API', { type, platform, options });
            res.json({ success: true, event: result });
        } catch (error) {
            Logger.error('Erro ao gerar evento específico via API', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }
}