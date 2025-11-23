"use client";

import { BlackjackButton } from "./BlackJackButton";
import { GameState, CardData, GAME_CONFIG } from "../shared/types";

export class BlackjackScene extends Phaser.Scene {
	// -- State --
	private deck: CardData[] = [];
	private playerHand: CardData[] = [];
	private dealerHand: CardData[] = [];
	private currentState: GameState = GameState.Betting;

	private playerCoins: number = 50;

	// Track visual objects mapped to their data
	private cardContainers = new Map<CardData, Phaser.GameObjects.Container>();

	// -- UI Components --
	private resultText!: Phaser.GameObjects.Text;
	private playerScoreText!: Phaser.GameObjects.Text;
	private dealerScoreText!: Phaser.GameObjects.Text;
	private coinsText!: Phaser.GameObjects.Text;

	private hitBtn!: BlackjackButton;
	private standBtn!: BlackjackButton;
	private dealBtn!: BlackjackButton;
	private restartBtn!: BlackjackButton;

	// -- Game Objects --
	private hiddenCardContainer?: Phaser.GameObjects.Container;

	// -- Data Constants --
	private readonly SUITS = ["♣", "♦", "♥", "♠"];
	private readonly RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

	// Spacing Configuration
	private readonly CARD_SPACING = 5;

	constructor() {
		super("BlackjackScene");
	}

	preload() {
		//this.load.image("background", "background.png");
		this.load.image("btn_green", "btn_green.png");
		this.load.image("btn_blue", "btn_blue.png");
		this.load.image("btn_red", "btn_red.png");

		this.load.spritesheet("cards", "cards.png", {
			frameWidth: GAME_CONFIG.cardWidth,
			frameHeight: GAME_CONFIG.cardHeight,
		});
	}

	create() {
		this.createBackground();
		this.createUI();
		this.startNewRound();
	}

	// --- Initialization Helpers ---

	private createBackground() {
		this.add.rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width, GAME_CONFIG.height, GAME_CONFIG.colors.background).setOrigin(0.5);
	}

	private createUI() {
		const cx = GAME_CONFIG.pos.centerX;

		// Title
		this.add.text(cx, 60, "BLACKJACK", { fontSize: "64px", fontStyle: "bold" }).setOrigin(0.5);

		// Coins Display
		this.coinsText = this.add.text(cx, 130, `Fichas: ${this.playerCoins}`, { fontSize: "40px", color: "#ffff00" }).setOrigin(0.5);

		// Score Boards
		this.dealerScoreText = this.add.text(cx, 400, "Dealer: 0", { fontSize: "40px" }).setOrigin(0.5);
		this.playerScoreText = this.add.text(cx, 700, "Jogador: 0", { fontSize: "40px" }).setOrigin(0.5);

		// Result Text (Win/Loss)
		this.resultText = this.add
			.text(cx, 600, "", {
				fontSize: "96px",
				fontStyle: "bold",
				color: GAME_CONFIG.colors.textHighlight,
				stroke: "#000",
				strokeThickness: 4,
			})
			.setOrigin(0.5)
			.setDepth(20);

		// Buttons
		this.createButtons(cx);
	}

	private createButtons(cx: number) {
		const btnY = 1000;

		this.hitBtn = new BlackjackButton(this, cx - 300, btnY, "PUXAR", GAME_CONFIG.colors.buttonHit, () => this.handleHit(), "btn_blue");

		this.standBtn = new BlackjackButton(this, cx, btnY, "PARAR", GAME_CONFIG.colors.buttonStand, () => this.handleStand(), "btn_red");

		this.dealBtn = new BlackjackButton(this, cx, btnY, "INICIAR", GAME_CONFIG.colors.buttonDeal, () => this.startPlayingPhase(), "btn_green");

		this.restartBtn = new BlackjackButton(this, cx, btnY, "CONTINUAR", GAME_CONFIG.colors.button, () => this.startNewRound());
	}

	// --- Game Flow Control ---

	private startNewRound() {
		this.cleanupBoard();
		this.resetState();
		this.generateDeck();
		this.shuffleDeck();

		this.updateUIState(GameState.Betting);
	}

	private cleanupBoard() {
		// Destroy all card containers found in our map
		this.cardContainers.forEach((container) => container.destroy());
		this.cardContainers.clear();

		this.hiddenCardContainer = undefined;
	}

	private resetState() {
		this.playerHand = [];
		this.dealerHand = [];
		this.resultText.setText("");
		this.playerScoreText.setText("Jogador: 0");
		this.dealerScoreText.setText("Dealer: 0");
		this.currentState = GameState.Betting;
	}

	private updateUIState(state: GameState) {
		this.currentState = state;
		const isBetting = state === GameState.Betting;
		const isGameOver = state === GameState.GameOver;

		this.dealBtn.setVisible(isBetting);
		this.hitBtn.setVisible(state === GameState.Playing);
		this.standBtn.setVisible(state === GameState.Playing);
		this.restartBtn.setVisible(isGameOver);
	}

	// --- Deck Logic ---

	private generateDeck() {
		this.deck = [];
		// suitIdx: 0..3, rankIdx: 0..12
		this.SUITS.forEach((suit, suitIdx) => {
			this.RANKS.forEach((value, rankIdx) => {
				let weight = parseInt(value);
				if (["J", "Q", "K"].includes(value)) weight = 10;
				if (value === "A") weight = 11;

				const frameIndex = suitIdx * 13 + rankIdx;

				this.deck.push({ suit, value, weight, frameIndex });
			});
		});
	}

	private shuffleDeck() {
		for (let i = this.deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
		}
	}

	// --- Playing Logic ---

	private startPlayingPhase() {
		this.updateUIState(GameState.Playing);

		// Initial Deal Sequence
		this.dealCardTo(this.playerHand, false, 0);
		this.dealCardTo(this.dealerHand, true, 500); // Hidden dealer card
		this.dealCardTo(this.playerHand, false, 1000);
		this.dealCardTo(this.dealerHand, false, 1500);

		this.time.delayedCall(1600, () => {
			this.updateScoresUI();
			this.checkInitialBlackjack();
		});
	}

	private dealCardTo(hand: CardData[], isHidden: boolean, delay: number) {
		if (this.deck.length === 0) return;

		const card = this.deck.pop()!;
		hand.push(card);

		const isPlayer = hand === this.playerHand;

		this.time.delayedCall(delay, () => {
			// 1. Create the visual card at the deck position
			this.renderCard(card, isPlayer, isHidden);

			// 2. Recalculate positions for the ENTIRE hand to center them
			this.repositionHand(hand, isPlayer);

			if (!isHidden) this.updateScoresUI();
		});
	}

	// --- Rendering ---

	private renderCard(card: CardData, isPlayer: boolean, isHidden: boolean) {
		// Container holds Face and Back
		// Start at Deck position
		const container = this.add.container(GAME_CONFIG.pos.deck.x, GAME_CONFIG.pos.deck.y);
		container.setData("isCard", true);
		container.setData("cardData", card);

		// Store reference for future movement
		this.cardContainers.set(card, container);

		// 1. Face
		const face = this.textures.exists("cards")
			? this.add.sprite(0, 0, "cards", card.frameIndex)
			: this.add.text(0, 0, `${card.value}\n${card.suit}`, { color: "#000", backgroundColor: "#fff" }).setOrigin(0.5);

		container.add(face);

		// 2. Back
		const back = this.add.graphics();
		back.fillStyle(GAME_CONFIG.colors.cardBack, 1);
		back.lineStyle(2, 0xffffff, 1);
		back.fillRoundedRect(-GAME_CONFIG.cardWidth / 2, -GAME_CONFIG.cardHeight / 2, GAME_CONFIG.cardWidth, GAME_CONFIG.cardHeight, 8);
		back.strokeRoundedRect(-GAME_CONFIG.cardWidth / 2, -GAME_CONFIG.cardHeight / 2, GAME_CONFIG.cardWidth, GAME_CONFIG.cardHeight, 8);
		back.setName("cardBack");
		container.add(back);

		// Visibility Logic
		if (isHidden) {
			container.setData("isHidden", true);
			this.hiddenCardContainer = container;
		} else {
			back.setVisible(false);
		}
	}

	/** * Recalculates the target position for every card in the hand
	 * to keep them centered with specific spacing.
	 */
	private repositionHand(hand: CardData[], isPlayer: boolean) {
		// Filter to only cards that have been rendered visually
		const visibleCards = hand.filter((card) => this.cardContainers.has(card));
		const count = visibleCards.length;

		if (count === 0) return;

		// CONSTANTS
		const cardW = GAME_CONFIG.cardWidth; // 106
		const spacing = this.CARD_SPACING; // 5
		const yPos = isPlayer ? GAME_CONFIG.pos.playerHandY : GAME_CONFIG.pos.dealerHandY;
		const screenCenter = GAME_CONFIG.pos.centerX;

		// 1. Calculate Total Width of the hand
		// Width = (N * CardWidth) + ((N-1) * Spacing)
		const totalWidth = count * cardW + (count - 1) * spacing;

		// 2. Calculate Starting X (Leftmost edge) so the group is centered
		const startX = screenCenter - totalWidth / 2;

		// 3. Move each card to its new position
		visibleCards.forEach((card, index) => {
			const container = this.cardContainers.get(card)!;

			// Calculate center position for this specific card
			// x = startX + (halfCard) + (index * (cardWidth + spacing))
			const targetX = startX + cardW / 2 + index * (cardW + spacing);

			// Tween to new position
			this.tweens.add({
				targets: container,
				x: targetX,
				y: yPos,
				angle: 360,
				duration: 500,
				ease: "Cubic.out",
			});
		});
	}

	private revealDealerCard() {
		if (!this.hiddenCardContainer) return;
		if (!this.hiddenCardContainer.getData("isHidden")) return;

		const back = this.hiddenCardContainer.getByName("cardBack");

		this.tweens.add({
			targets: this.hiddenCardContainer,
			scaleX: 0,
			duration: 150,
			onComplete: () => {
				if (back && "setVisible" in back) (back as any).setVisible(false);
				this.hiddenCardContainer!.setData("isHidden", false);

				this.tweens.add({
					targets: this.hiddenCardContainer,
					scaleX: 1,
					duration: 150,
				});
				this.updateScoresUI();
			},
		});
	}

	private calculateHandValue(hand: CardData[]): number {
		let score = 0;
		let aces = 0;

		hand.forEach((c) => {
			score += c.weight;
			if (c.value === "A") aces++;
		});

		while (score > 21 && aces > 0) {
			score -= 10;
			aces--;
		}
		return score;
	}

	private updateScoresUI() {
		const pScore = this.calculateHandValue(this.playerHand);
		this.playerScoreText.setText(`Player: ${pScore}`);

		// If dealer card is hidden, only calculate visible cards (index 1+)
		const isHidden = this.hiddenCardContainer?.getData("isHidden");

		if (isHidden) {
			const visibleCards = this.dealerHand.slice(1);
			let dScore = 0;
			if (visibleCards.length > 0) {
				dScore = this.calculateHandValue(visibleCards);
			}
			this.dealerScoreText.setText(`Dealer: ${dScore} + ?`);
		} else {
			const dScore = this.calculateHandValue(this.dealerHand);
			this.dealerScoreText.setText(`Dealer: ${dScore}`);
		}
	}

	// --- Actions ---

	private handleHit() {
		if (this.currentState !== GameState.Playing) return;

		this.dealCardTo(this.playerHand, false, 0);

		this.time.delayedCall(500, () => {
			const score = this.calculateHandValue(this.playerHand);
			if (score > 21) {
				this.endGame("ESTOUROU!", false);
			}
		});
	}

	private handleStand() {
		if (this.currentState !== GameState.Playing) return;

		this.updateUIState(GameState.DealerTurn);
		this.revealDealerCard();

		this.time.addEvent({
			delay: 1000,
			callback: () => this.processDealerTurn(),
			callbackScope: this,
			loop: true,
		});
	}

	private processDealerTurn() {
		const score = this.calculateHandValue(this.dealerHand);

		if (score < 17) {
			this.dealCardTo(this.dealerHand, false, 0);
		} else {
			this.time.removeAllEvents();
			this.determineWinner();
		}
	}

	private checkInitialBlackjack() {
		const pScore = this.calculateHandValue(this.playerHand);
		const dScore = this.calculateHandValue(this.dealerHand);

		if (pScore === 21) {
			if (dScore === 21) {
				this.revealDealerCard();
				this.endGame("EMPATE!", null);
			} else {
				this.endGame("BLACKJACK!", true);
			}
		}
	}

	private determineWinner() {
		const pScore = this.calculateHandValue(this.playerHand);
		const dScore = this.calculateHandValue(this.dealerHand);

		if (dScore > 21) {
			this.endGame("DEALER ESTOUROU!", true);
		} else if (pScore > dScore) {
			this.endGame("GANHOU!", true);
		} else if (pScore < dScore) {
			this.endGame("PERDEU", false);
		} else {
			this.endGame("EMPATE!", null);
		}
	}
	private endGame(message: string, winStatus: boolean | null) {
		this.updateUIState(GameState.GameOver);
		this.resultText.setText(message);

		if (winStatus === true) {
			this.playerCoins += 10;
			this.resultText.setColor("#00FF00");
			// Update Button to Green
			this.restartBtn.updateTexture("btn_green");
		} else if (winStatus === false) {
			this.playerCoins -= 10;
			this.resultText.setColor("#FF0000");
			// Update Button to Red
			this.restartBtn.updateTexture("btn_red");
		} else {
			this.resultText.setColor("#FFFFFF");
			// Default for Push
			this.restartBtn.updateTexture("btn_blue");
		}

		this.coinsText.setText(`Coins: ${this.playerCoins}`);
	}
}
