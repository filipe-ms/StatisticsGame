"use client";

import { BlackjackButton } from "../shared/BlackJackButton";
import { GameState, CardData, GAME_CONFIG } from "../shared/types";

export class BlackjackScene extends Phaser.Scene {
	// -- State --
	private deck: CardData[] = [];
	private playerHand: CardData[] = [];
	private dealerHand: CardData[] = [];
	private currentState: GameState = GameState.Betting;

	/*
	totalPlays is the amount of times the player has click draw or stay.
	risk is based on win/loss chance for each of the draws or stay, that should be calculated through hypergeometric and persists through hands.
	winChance is based on the hand and should be updated after each time the player draws a new card. It resets through hands.
	playerWinLossRatio speaks for itself. It is kept through hands.
	handWinChanceHistory is kepot through hands. It is the chance the hand had to win when the player clicks stay.
	*/

	// -- Statistics --
	private totalPlays: number = 0;

	// Risk
	private riskyPlays: number = 0;
	private riskAverage: number = 0;
	private riskHistory: number[] = [];

	// Win Chance
	private winChance: number = 0;
	private winChanceAtStand: number = 0; // Snapshot for luck calculation
	private winChanceHistory: number[] = [];

	// Luck
	private luckFactor: number = 0; // Accumulator: (Result - Expected)
	private luckHistory: number[] = [];

	// Perfect Play (Basic Strategy)
	private perfectPlayCount: number = 0;
	private totalDecisions: number = 0;
	private perfectPlayPercent: number = 0;
	private decisionHistory: { action: string; optimal: string; isCorrect: boolean }[] = [];

	// 1 = Win, 0 = Loss, null = Tie
	private winLossHistory: (number | null)[] = [];
	cardsDrawn: number = 0;

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
	private readonly RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

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
		this.winChanceAtStand = 0;
		// Note: Statistics persist
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

		this.dealCardTo(this.playerHand, false, 0);
		this.dealCardTo(this.dealerHand, true, 500);
		this.dealCardTo(this.playerHand, false, 1000);
		this.dealCardTo(this.dealerHand, false, 1500);

		this.time.delayedCall(1600, () => {
			this.updateScoresUI();
			this.updateStatsAfterDeal();
			this.checkInitialBlackjack();
		});
	}

	private dealCardTo(hand: CardData[], isHidden: boolean, delay: number) {
		if (this.deck.length === 0) return;

		const card = this.deck.pop()!;
		hand.push(card);

		const isPlayer = hand === this.playerHand;

		this.time.delayedCall(delay, () => {
			this.renderCard(card, isPlayer, isHidden);
			this.repositionHand(hand, isPlayer);
			if (!isHidden) this.updateScoresUI();
		});
	}

	// --- Rendering ---

	private renderCard(card: CardData, isPlayer: boolean, isHidden: boolean) {
		const container = this.add.container(GAME_CONFIG.pos.deck.x, GAME_CONFIG.pos.deck.y);
		container.setData("isCard", true);
		container.setData("cardData", card);

		this.cardContainers.set(card, container);

		const face = this.textures.exists("cards")
			? this.add.sprite(0, 0, "cards", card.frameIndex)
			: this.add.text(0, 0, `${card.value}\n${card.suit}`, { color: "#000", backgroundColor: "#fff" }).setOrigin(0.5);

		container.add(face);

		const back = this.add.graphics();
		back.fillStyle(GAME_CONFIG.colors.cardBack, 1);
		back.lineStyle(2, 0xffffff, 1);
		back.fillRoundedRect(-GAME_CONFIG.cardWidth / 2, -GAME_CONFIG.cardHeight / 2, GAME_CONFIG.cardWidth, GAME_CONFIG.cardHeight, 8);
		back.strokeRoundedRect(-GAME_CONFIG.cardWidth / 2, -GAME_CONFIG.cardHeight / 2, GAME_CONFIG.cardWidth, GAME_CONFIG.cardHeight, 8);
		back.setName("cardBack");
		container.add(back);

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
		const visibleCards = hand.filter((card) => this.cardContainers.has(card));
		const count = visibleCards.length;

		if (count === 0) return;

		const cardW = GAME_CONFIG.cardWidth;
		const spacing = this.CARD_SPACING;
		const yPos = isPlayer ? GAME_CONFIG.pos.playerHandY : GAME_CONFIG.pos.dealerHandY;
		const screenCenter = GAME_CONFIG.pos.centerX;

		const totalWidth = count * cardW + (count - 1) * spacing;
		const startX = screenCenter - totalWidth / 2;

		visibleCards.forEach((card, index) => {
			const container = this.cardContainers.get(card)!;
			const targetX = startX + cardW / 2 + index * (cardW + spacing);

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

		this.trackAction("hit");

		this.dealCardTo(this.playerHand, false, 0);

		this.time.delayedCall(500, () => {
			const score = this.calculateHandValue(this.playerHand);
			this.winChance = this.calculateWinProbability();

			if (score > 21) {
				this.endGame("ESTOUROU!", false);
			}
		});
	}

	private handleStand() {
		if (this.currentState !== GameState.Playing) return;

		this.trackAction("stand");

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

		// Calculate Luck based on the result
		this.updateLuckStats(winStatus);

		if (winStatus === true) {
			this.playerCoins += 10;
			this.resultText.setColor("#00FF00");
			this.restartBtn.updateTexture("btn_green");
			this.winLossHistory.push(1);
		} else if (winStatus === false) {
			this.playerCoins -= 10;
			this.resultText.setColor("#FF0000");
			this.restartBtn.updateTexture("btn_red");
			this.winLossHistory.push(0);
		} else {
			this.resultText.setColor("#FFFFFF");
			this.restartBtn.updateTexture("btn_blue");
			this.winLossHistory.push(null);
		}

		this.coinsText.setText(`Coins: ${this.playerCoins}`);
		console.log("Win/Loss History:", this.winLossHistory);
	}

	// --- Statistics & Probabilities ---

	private isSoftHand(hand: CardData[]): boolean {
		let score = 0;
		let aces = 0;
		hand.forEach((c) => {
			score += c.weight;
			if (c.value === "A") aces++;
		});

		// If we have aces, and calculating raw weight keeps us <= 21, we are using an Ace as 11.
		// If we have to subtract 10 to stay under 21 for ALL aces, it is Hard.
		if (aces === 0) return false;

		// Simple check: Calculate max possible score (all aces 11)
		// If that score > 21, we reduce.
		// If after reducing ALL aces to 1 we are still <= 21, then it was hard/soft transition.
		// Actually simpler: A hand is soft if it contains an Ace valued at 11.
		// My calculateHandValue reduces automatically.
		// If (Score - 10) is still a valid Total for the cards if Ace was 1, then Ace is currently 11.
		// Wait, easier way:
		let rawScore = 0;
		hand.forEach((c) => (rawScore += c.weight)); // Ace is 11 here

		// If we have aces and rawScore <= 21, it's Soft.
		// If rawScore > 21, we subtract 10. If we *stop* subtracting before running out of aces because we hit <=21, it's still soft.
		// If we reduce ALL aces and score <= 21, it's Hard.

		let tempScore = rawScore;
		let tempAces = aces;

		while (tempScore > 21 && tempAces > 0) {
			tempScore -= 10;
			tempAces--;
		}

		// If we still have "active" aces (tempAces > 0) that act as 11, it is soft.
		return tempAces > 0;
	}

	private calculateBustProbability(): number {
		const currentScore = this.calculateHandValue(this.playerHand);
		if (currentScore >= 21) return 1.0;

		const buffer = 21 - currentScore;
		let bustCards = 0;
		const totalCards = this.deck.length;

		if (totalCards === 0) return 0;

		for (const card of this.deck) {
			let val = card.weight;
			if (card.value === "A") val = 1;
			if (val > buffer) {
				bustCards++;
			}
		}
		return bustCards / totalCards;
	}

	private calculateWinProbability(simulations = 500): number {
		const pScore = this.calculateHandValue(this.playerHand);
		if (pScore > 21) return 0;

		let wins = 0;

		for (let i = 0; i < simulations; i++) {
			const simDeck = [...this.deck];
			// Shuffle sim deck
			for (let j = simDeck.length - 1; j > 0; j--) {
				const k = Math.floor(Math.random() * (j + 1));
				[simDeck[j], simDeck[k]] = [simDeck[k], simDeck[j]];
			}

			const simDealerHand = [...this.dealerHand];
			let dScore = this.calculateHandValue(simDealerHand);

			while (dScore < 17 && simDeck.length > 0) {
				simDealerHand.push(simDeck.pop()!);
				dScore = this.calculateHandValue(simDealerHand);
			}

			if (dScore > 21) wins++;
			else if (pScore > dScore) wins++;
		}
		return wins / simulations;
	}

	private updateStatsAfterDeal() {
		this.winChance = this.calculateWinProbability();
		console.log(`Stats Update - Win Chance: ${(this.winChance * 100).toFixed(1)}%`);
	}

	/**
	 * Calculates the Optimal Move based on Basic Strategy (Simplified)
	 * returns "hit" or "stand"
	 */
	private getOptimalMove(): "hit" | "stand" {
		const pScore = this.calculateHandValue(this.playerHand);
		const isSoft = this.isSoftHand(this.playerHand);

		// Get dealer up card value (index 1 is visible)
		// If hidden, we use index 1. If revealed, still index 1 was the upcard.
		const dCard = this.dealerHand.length > 1 ? this.dealerHand[1] : this.dealerHand[0];
		// Fallback for safety, though dealerHand should have 2 cards (1 hidden, 1 visible)

		let dVal = dCard.weight;
		if (dCard.value === "A") dVal = 11; // Treat Dealer Ace as 11 for table lookup

		if (isSoft) {
			// Soft Totals
			if (pScore >= 19) return "stand"; // Soft 19-21
			if (pScore === 18) {
				// Soft 18: Stand vs 2,7,8. Hit vs 9,10,A. (Double vs 3-6 -> Hit here)
				if ([2, 7, 8].includes(dVal)) return "stand";
				return "hit"; // Hit vs 9, 10, A, and 3-6 (since we cant double)
			}
			return "hit"; // Soft 17 or less
		} else {
			// Hard Totals
			if (pScore >= 17) return "stand";
			if (pScore >= 13) {
				// 13-16: Stand vs 2-6, Hit vs 7-A
				if (dVal >= 2 && dVal <= 6) return "stand";
				return "hit";
			}
			if (pScore === 12) {
				// 12: Stand vs 4-6, Hit vs else
				if (dVal >= 4 && dVal <= 6) return "stand";
				return "hit";
			}
			return "hit"; // 11 or less
		}
	}

	private updatePerfectPlayStats(action: "hit" | "stand") {
		this.totalDecisions++;

		const optimal = this.getOptimalMove();
		const isCorrect = action === optimal;

		if (isCorrect) {
			this.perfectPlayCount++;
		}

		this.perfectPlayPercent = this.perfectPlayCount / this.totalDecisions;

		this.decisionHistory.push({ action, optimal, isCorrect });

		console.log(`Move: ${action.toUpperCase()} | Optimal: ${optimal.toUpperCase()} | Perfect%: ${(this.perfectPlayPercent * 100).toFixed(1)}%`);
	}

	private updateLuckStats(winStatus: boolean | null) {
		// Luck is calculated as: (Result Score - Win Probability at Stand)
		// Result Score: Win=1, Loss=0, Tie=0.5

		// If we never stood (e.g. busted immediately), winChanceAtStand is 0,
		// but we shouldn't calculate luck on a Bust caused by risk.
		// So we only calculate luck if we actually reached the Stand phase.
		if (this.winChanceAtStand === 0 && this.currentState === GameState.GameOver) {
			// Player likely busted.
			return;
		}

		let resultScore = 0;
		if (winStatus === true) resultScore = 1;
		else if (winStatus === null) resultScore = 0.5;
		else resultScore = 0; // Loss

		const luckImpact = resultScore - this.winChanceAtStand;

		this.luckFactor += luckImpact;
		this.luckHistory.push(luckImpact);

		console.log(`Luck Update: Result(${resultScore}) - Chance(${this.winChanceAtStand.toFixed(2)}) = ${luckImpact.toFixed(2)} | Total Luck: ${this.luckFactor.toFixed(2)}`);
	}

	private trackAction(action: "hit" | "stand") {
		this.totalPlays++;

		// 1. Update Perfect Play Stats
		this.updatePerfectPlayStats(action);

		let risk = 0;
		let isRisky = false;

		if (action === "hit") {
			risk = this.calculateBustProbability();
			if (risk > 0.4) isRisky = true;
		} else {
			const winProb = this.calculateWinProbability();
			risk = 1.0 - winProb;
			if (winProb < 0.3) isRisky = true;

			// Snapshot win probability when standing for Luck calculation later
			this.winChanceAtStand = winProb;
			this.winChanceHistory.push(winProb);
		}

		if (isRisky) this.riskyPlays++;
		this.riskHistory.push(risk);
		this.riskAverage = this.riskHistory.reduce((a, b) => a + b, 0) / this.riskHistory.length;
	}
}
