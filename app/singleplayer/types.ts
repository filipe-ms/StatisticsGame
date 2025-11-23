export enum GameState {
	Betting = "BETTING",
	Playing = "PLAYING",
	DealerTurn = "DEALER_TURN",
	GameOver = "GAME_OVER",
}

export interface CardData {
	suit: string;
	value: string;
	weight: number;
	frameIndex: number;
}

// Configuration Constants
export const GAME_CONFIG = {
	width: 1600,
	height: 1200,
	cardWidth: 106,
	cardHeight: 158,
	colors: {
		background: 0x095a2a,
		button: 0x333333,
		buttonHit: 0x0000aa,
		buttonStand: 0xaa0000,
		buttonDeal: 0x00aa00,
		text: "#ffffff",
		textHighlight: "#ffff00",
		cardBack: 0xaa3333,
	},
	pos: {
		deck: { x: 1400, y: 100 },
		playerHandY: 800,
		dealerHandY: 300,
		centerX: 800,
	},
} as const;
