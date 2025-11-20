"use client";

import { useEffect, useRef } from "react";
import { BlackjackScene } from "./BlackJackScene";
import { GAME_CONFIG } from "./types";
import * as Phaser from "phaser";

export default function BlackjackGame() {
	const containerRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Phaser.Game | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		if (gameRef.current) return;

		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			width: GAME_CONFIG.width,
			height: GAME_CONFIG.height,
			parent: containerRef.current,
			backgroundColor: "#000000",
			scene: BlackjackScene,
			scale: {
				mode: Phaser.Scale.FIT,
				autoCenter: Phaser.Scale.CENTER_BOTH,
			},
		};

		gameRef.current = new Phaser.Game(config);

		return () => {
			if (gameRef.current) {
				gameRef.current.destroy(true);
				gameRef.current = null;
			}
		};
	}, []);

	return <div ref={containerRef} />;
}
