/* eslint-disable @typescript-eslint/no-explicit-any */
// Event emitter para comunicação entre Phaser Scene e React Components
export class StatisticsEmitter {
	private static instance: StatisticsEmitter;
	private listeners: Map<string, Set<(data: any) => void>> = new Map();

	private constructor() {}

	static getInstance(): StatisticsEmitter {
		if (!StatisticsEmitter.instance) {
			StatisticsEmitter.instance = new StatisticsEmitter();
		}
		return StatisticsEmitter.instance;
	}

	on(event: string, callback: (data: any) => void) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(callback);
	}

	off(event: string, callback: (data: any) => void) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.delete(callback);
		}
	}

	emit(event: string, data: any) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.forEach((callback) => callback(data));
		}
	}
}

export interface StatisticsData {
	bustProbability: number;
	winChance: number;
	winChanceHistory: number[];
	riskHistory: number[];
	totalPlays: number;
}



